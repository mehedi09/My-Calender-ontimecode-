using System;
using System.Web.Caching;
using System.Data;
using System.Data.Common;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml;
using System.Xml.XPath;
using System.Xml.Xsl;
using System.Web;
using Microsoft.Reporting.WebForms;
using TimeNAction.Data;

namespace TimeNAction.Handlers
{
	public partial class Report : ReportBase
    {
    }
    
    public class ReportBase : GenericHandlerBase, IHttpHandler, System.Web.SessionState.IRequiresSessionState
    {
        
        bool IHttpHandler.IsReusable
        {
            get
            {
                return false;
            }
        }
        
        void IHttpHandler.ProcessRequest(HttpContext context)
        {
            string c = context.Request["c"];
            string q = context.Request["q"];
            if (String.IsNullOrEmpty(c) || String.IsNullOrEmpty(q))
            	throw new Exception("Invalid report request.");
            // 
#pragma warning disable 0618
            System.Web.Script.Serialization.JavaScriptSerializer serializer = new System.Web.Script.Serialization.JavaScriptSerializer();
            // 
#pragma warning restore 0618
            // create a data table for report
            PageRequest request = serializer.Deserialize<PageRequest>(q);
            request.PageIndex = 0;
            request.PageSize = Int32.MaxValue;
            request.RequiresMetaData = true;
            string templateName = context.Request.Form["a"];
            // try to generate a report via a business rule
            string aa = context.Request["aa"];
            ActionArgs args = null;
            if (!(String.IsNullOrEmpty(aa)))
            {
                args = serializer.Deserialize<ActionArgs>(aa);
                IDataController controller = ControllerFactory.CreateDataController();
                ActionResult result = controller.Execute(args.Controller, args.View, args);
                if (!(String.IsNullOrEmpty(result.NavigateUrl)))
                {
                    AppendDownloadTokenCookie();
                    context.Response.Redirect(result.NavigateUrl);
                }
                if (result.Canceled)
                {
                    AppendDownloadTokenCookie();
                    return;
                }
                result.RaiseExceptionIfErrors();
                // parse action data
                SortedDictionary<string, string> actionData = new SortedDictionary<string, string>();
                ((DataControllerBase)(controller)).Config.ParseActionData(args.Path, actionData);
                List<string> filter = new List<string>();
                foreach (string name in actionData.Keys)
                {
                    string v = actionData[name];
                    if (name.StartsWith("_"))
                    {
                        if (name == "_controller")
                        	request.Controller = v;
                        if (name == "_view")
                        	request.View = v;
                        if (name == "_sortExpression")
                        	request.SortExpression = v;
                        if (name == "_count")
                        	request.PageSize = Convert.ToInt32(v);
                        if (name == "_template")
                        	templateName = v;
                    }
                    else
                    	if (v == "@Arguments_SelectedValues")
                        	if ((args.SelectedValues != null) && (args.SelectedValues.Length > 0))
                            {
                                StringBuilder sb = new StringBuilder();
                                foreach (string key in args.SelectedValues)
                                {
                                    if (sb.Length > 0)
                                    	sb.Append("$or$");
                                    sb.Append(key);
                                }
                                filter.Add(String.Format("{0}:$in${1}", name, sb.ToString()));
                            }
                            else
                            	return;
                        else
                        	if (Regex.IsMatch(v, "^(\'|\").+(\'|\")$"))
                            	filter.Add(String.Format("{0}:={1}", name, v.Substring(1, (v.Length - 2))));
                            else
                            	if (args.Values != null)
                                	foreach (FieldValue fv in args.Values)
                                    	if (fv.Name == v)
                                        	filter.Add(String.Format("{0}:={1}", name, fv.Value));
                    request.Filter = filter.ToArray();
                }
            }
            // load report definition
            string reportTemplate = Controller.CreateReportInstance(null, templateName, request.Controller, request.View);
            ViewPage page = ControllerFactory.CreateDataController().GetPage(request.Controller, request.View, request);
            DataTable table = page.ToDataTable();
            // figure report output format
            Match m = Regex.Match(c, "^(ReportAs|Report)(Pdf|Excel|Image|Word|)$");
            string reportFormat = m.Groups[2].Value;
            if (String.IsNullOrEmpty(reportFormat))
            	reportFormat = "Pdf";
            // render a report
            string mimeType = null;
            string encoding = null;
            string fileNameExtension = null;
            string[] streams = null;
            Warning[] warnings = null;
            using (LocalReport report = new LocalReport())
            {
                report.EnableHyperlinks = true;
                report.EnableExternalImages = true;
                report.LoadReportDefinition(new StringReader(reportTemplate));
                report.DataSources.Add(new ReportDataSource(request.Controller, table));
                report.EnableExternalImages = true;
                foreach (ReportParameterInfo p in report.GetParameters())
                {
                    if (p.Name.Equals("FilterDetails") && !(String.IsNullOrEmpty(request.FilterDetails)))
                    	report.SetParameters(new ReportParameter("FilterDetails", request.FilterDetails));
                    if (p.Name.Equals("BaseUrl"))
                    {
                        string baseUrl = context.Request.Url.AbsoluteUri;
                        baseUrl = baseUrl.Substring(0, baseUrl.LastIndexOf('/'));
                        report.SetParameters(new ReportParameter("BaseUrl", baseUrl));
                    }
                    if (p.Name.Equals("Query"))
                    	report.SetParameters(new ReportParameter("Query", HttpUtility.UrlEncode(q)));
                }
                report.SetBasePermissionsForSandboxAppDomain(new System.Security.PermissionSet(System.Security.Permissions.PermissionState.Unrestricted));
                byte[] reportData = report.Render(reportFormat, null, out mimeType, out encoding, out fileNameExtension, out streams, out warnings);
                // send report data to the client
                context.Response.Clear();
                context.Response.ContentType = mimeType;
                context.Response.AddHeader("Content-Length", reportData.Length.ToString());
                AppendDownloadTokenCookie();
                string fileName = FormatFileName(context, request, fileNameExtension);
                if (String.IsNullOrEmpty(fileName))
                {
                    fileName = String.Format("{0}_{1}.{2}", request.Controller, request.View, fileNameExtension);
                    if (args != null)
                    	fileName = GenerateOutputFileName(args, fileName);
                }
                context.Response.AddHeader("Content-Disposition", String.Format("attachment;filename={0}", fileName));
                context.Response.OutputStream.Write(reportData, 0, reportData.Length);
            }
        }
        
        protected virtual string FormatFileName(HttpContext context, PageRequest request, string extension)
        {
            return null;
        }
    }
}

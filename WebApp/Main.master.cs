using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using System.Web.UI.WebControls;
using TimeNAction.Services;
using TimeNAction.Web;



public partial class Main : System.Web.UI.MasterPage
{
    
    public static string[] MicrosoftJavaScript = new string[] {
            "MicrosoftAjax.js",
            "MicrosoftAjaxWebForms.js",
            "MicrosoftAjaxApplicationServices.js"};
    
    protected void Page_Load(object sender, EventArgs e)
    {
        string pageCssClass = (Page.GetType().Name + " Loading");
        PropertyInfo p = Page.GetType().GetProperty("CssClass");
        if (null != p)
        {
            string cssClassName = ((string)(p.GetValue(Page, null)));
            if (!(String.IsNullOrEmpty(pageCssClass)))
            	pageCssClass = (pageCssClass + " ");
            pageCssClass = (pageCssClass + cssClassName);
        }
        if (!(pageCssClass.Contains("Wide")))
        	pageCssClass = (pageCssClass + " Standard");
        LiteralControl c = ((LiteralControl)(Page.Form.Controls[0]));
        if ((null != c) && !(String.IsNullOrEmpty(pageCssClass)))
        	c.Text = Regex.Replace(c.Text, "<div>", String.Format("<div class=\"{0}\">", pageCssClass));
    }
    
    protected void Page_PreRender(object sender, EventArgs e)
    {
        ApplicationServices.RegisterCssLinks(Page);
    }
    
    protected void sm_ResolveScriptReference(object sender, ScriptReferenceEventArgs e)
    {
        if (System.Array.IndexOf(MicrosoftJavaScript, e.Script.Name) >= 0)
        {
            e.Script.Name = ("TimeNAction.Scripts." + e.Script.Name);
            e.Script.Assembly = typeof(AquariumExtenderBase).Assembly.FullName;
        }
    }
}

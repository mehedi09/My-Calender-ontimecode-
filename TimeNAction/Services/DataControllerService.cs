using System;
using System.Collections.Generic;
using System.Text;
using System.Web;
using System.Web.Services;
using System.Web.Script.Services;
using TimeNAction.Data;

namespace TimeNAction.Services
{
	[WebService(Namespace="http://www.codeontime.com/productsdaf.aspx")]
    [WebServiceBinding(ConformsTo=WsiProfiles.BasicProfile1_1)]
    [ScriptService]
    public class DataControllerService : System.Web.Services.WebService
    {
        
        public DataControllerService()
        {
        }
        
        [WebMethod(EnableSession=true)]
        [ScriptMethod]
        public ViewPage GetPage(string controller, string view, PageRequest request)
        {
            return ControllerFactory.CreateDataController().GetPage(controller, view, request);
        }
        
        [WebMethod(EnableSession=true)]
        [ScriptMethod]
        public object[] GetListOfValues(string controller, string view, DistinctValueRequest request)
        {
            return ControllerFactory.CreateDataController().GetListOfValues(controller, view, request);
        }
        
        [WebMethod(EnableSession=true)]
        [ScriptMethod]
        public ActionResult Execute(string controller, string view, ActionArgs args)
        {
            return ControllerFactory.CreateDataController().Execute(controller, view, args);
        }
        
        [WebMethod(EnableSession=true)]
        [ScriptMethod]
        public string[] GetCompletionList(string prefixText, int count, string contextKey)
        {
            return ControllerFactory.CreateAutoCompleteManager().GetCompletionList(prefixText, count, contextKey);
        }
    }
}

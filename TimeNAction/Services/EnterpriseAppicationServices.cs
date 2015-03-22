using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Routing;
using TimeNAction.Data;
using TimeNAction.Security;

namespace TimeNAction.Services
{
	public partial class EnterpriseApplicationServices : EnterpriseApplicationServicesBase
    {
    }
    
    public class EnterpriseApplicationServicesBase : ApplicationServicesBase
    {
        
        public static Regex AppServicesRegex = new Regex("/appservices/(?\'Controller\'.+?)(/|$)", RegexOptions.IgnoreCase);
        
        public static Regex DynamicResourceRegex = new Regex("(\\.js$|^_(invoke|authenticate)$)", RegexOptions.IgnoreCase);
        
        public static Regex DynamicWebResourceRegex = new Regex("\\.(js|css)$", RegexOptions.IgnoreCase);
        
        public override void RegisterServices()
        {
            RegisterREST();
            base.RegisterServices();
        }
        
        public virtual void RegisterREST()
        {
            RouteCollection routes = RouteTable.Routes;
            routes.RouteExistingFiles = true;
            GenericRoute.Map(routes, new RepresentationalStateTransfer(), "appservices/{Controller}/{Segment1}/{Segment2}/{Segment3}/{Segment4}");
            GenericRoute.Map(routes, new RepresentationalStateTransfer(), "appservices/{Controller}/{Segment1}/{Segment2}/{Segment3}");
            GenericRoute.Map(routes, new RepresentationalStateTransfer(), "appservices/{Controller}/{Segment1}/{Segment2}");
            GenericRoute.Map(routes, new RepresentationalStateTransfer(), "appservices/{Controller}/{Segment1}");
            GenericRoute.Map(routes, new RepresentationalStateTransfer(), "appservices/{Controller}");
        }
        
        public override bool RequiresAuthentication(HttpRequest request)
        {
            bool result = base.RequiresAuthentication(request);
            if (result)
            	return true;
            Match m = AppServicesRegex.Match(request.Path);
            if (m.Success)
            {
                ControllerConfiguration config = null;
                try
                {
                    string controllerName = m.Groups["Controller"].Value;
                    if (!(DynamicResourceRegex.IsMatch(controllerName)))
                    	config = DataControllerBase.CreateConfigurationInstance(GetType(), controllerName);
                    if (controllerName == "_authenticate")
                    	return false;
                }
                catch (Exception )
                {
                }
                if (config == null)
                	return !(DynamicWebResourceRegex.IsMatch(request.Path));
                return RequiresRESTAuthentication(request, config);
            }
            return false;
        }
        
        public virtual bool RequiresRESTAuthentication(HttpRequest request, ControllerConfiguration config)
        {
            return UriRestConfig.RequiresAuthentication(request, config);
        }
    }
    
    public class GenericRoute : IRouteHandler
    {
        
        private IHttpHandler _handler;
        
        public GenericRoute(IHttpHandler handler)
        {
            _handler = handler;
        }
        
        IHttpHandler IRouteHandler.GetHttpHandler(RequestContext context)
        {
            return _handler;
        }
        
        public static void Map(RouteCollection routes, IHttpHandler handler, string url)
        {
            Route r = new Route(url, new GenericRoute(handler));
            r.Defaults = new RouteValueDictionary();
            r.Constraints = new RouteValueDictionary();
            routes.Add(r);
        }
    }
}

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using System.Web.Security;
using TimeNAction.Data;

namespace TimeNAction.Services
{
	public partial class ApplicationServices : ApplicationServicesBase
    {
        
        public static void Initialize()
        {
            ApplicationServices services = new ApplicationServices();
            services.RegisterServices();
        }
    }
    
    public class ApplicationServicesBase
    {
        
        public static bool EnableMobileClient = true;
        
        public virtual string Realm
        {
            get
            {
                return "TimeNAction Application Services";
            }
        }
        
        public static bool IsMobileClient
        {
            get
            {
                return false;
            }
        }
        
        public virtual void RegisterServices()
        {
            CreateStandardMembershipAccounts();
        }
        
        public virtual void CreateStandardMembershipAccounts()
        {
        }
        
        public virtual bool RequiresAuthentication(HttpRequest request)
        {
            return request.Path.EndsWith("Export.ashx", StringComparison.CurrentCultureIgnoreCase);
        }
        
        public virtual bool AuthenticateRequest(HttpContext context)
        {
            return false;
        }
        
        public static void RegisterStandardMembershipAccounts()
        {
            MembershipUser admin = Membership.GetUser("admin");
            if ((admin != null) && admin.IsLockedOut)
            	admin.UnlockUser();
            MembershipUser user = Membership.GetUser("user");
            if ((user != null) && user.IsLockedOut)
            	user.UnlockUser();
            if (Membership.GetUser("admin") == null)
            {
                MembershipCreateStatus status;
                admin = Membership.CreateUser("admin", "admin123%", "admin@TimeNAction.com", "ASP.NET", "Code OnTime", true, out status);
                user = Membership.CreateUser("user", "user123%", "user@TimeNAction.com", "ASP.NET", "Code OnTime", true, out status);
                Roles.CreateRole("Administrators");
                Roles.CreateRole("Users");
                Roles.AddUserToRole(admin.UserName, "Users");
                Roles.AddUserToRole(user.UserName, "Users");
                Roles.AddUserToRole(admin.UserName, "Administrators");
            }
        }
        
        public static void RegisterCssLinks(Page p)
        {
            foreach (Control c in p.Header.Controls)
            	if (c is HtmlLink)
                {
                    HtmlLink l = ((HtmlLink)(c));
                    if (l.ID == "TimeNActionTheme")
                    	return;
                    if (l.Href.Contains("_Theme_Plastic.css"))
                    {
                        l.ID = "TimeNActionTheme";
                        if (!(l.Href.Contains("?")))
                        	l.Href = (l.Href + String.Format("?{0}", ApplicationServices.Version));
                        return;
                    }
                }
        }
    }
    
    public partial class ApplicationSiteMapProvider : ApplicationSiteMapProviderBase
    {
    }
    
    public class ApplicationSiteMapProviderBase : System.Web.XmlSiteMapProvider
    {
        
        public override bool IsAccessibleToUser(HttpContext context, SiteMapNode node)
        {
            string device = node["Device"];
            if ((device == "Mobile") && !(ApplicationServices.IsMobileClient))
            	return false;
            if ((device == "Desktop") && ApplicationServices.IsMobileClient)
            	return false;
            return base.IsAccessibleToUser(context, node);
        }
    }
}

using System;
using System.Data;
using System.Collections.Generic;
using System.ComponentModel;
using System.Configuration;
using System.Text;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using TimeNAction.Data;

namespace TimeNAction.Web
{
	public partial class MembershipBarExtender : MembershipBarExtenderBase
    {
    }
    
    [TargetControlType(typeof(HtmlGenericControl))]
    [ToolboxItem(false)]
    public class MembershipBarExtenderBase : AquariumExtenderBase
    {
        
        public MembershipBarExtenderBase() : 
                base("Web.Membership")
        {
        }
        
        protected override void ConfigureDescriptor(ScriptBehaviorDescriptor descriptor)
        {
            descriptor.AddProperty("displayRememberMe", Properties["DisplayRememberMe"]);
            descriptor.AddProperty("rememberMeSet", Properties["RememberMeSet"]);
            descriptor.AddProperty("displaySignUp", Properties["DisplaySignUp"]);
            descriptor.AddProperty("displayPasswordRecovery", Properties["DisplayPasswordRecovery"]);
            descriptor.AddProperty("displayMyAccount", Properties["DisplayMyAccount"]);
            string s = ((string)(Properties["Welcome"]));
            if (!(String.IsNullOrEmpty(s)))
            	descriptor.AddProperty("welcome", Properties["Welcome"]);
            s = ((string)(Properties["User"]));
            if (!(String.IsNullOrEmpty(s)))
            	descriptor.AddProperty("user", Properties["User"]);
            descriptor.AddProperty("displayHelp", Properties["DisplayHelp"]);
            descriptor.AddProperty("displayLogin", Properties["DisplayLogin"]);
        }
        
        protected override void ConfigureScripts(List<ScriptReference> scripts)
        {
            if (EnableCombinedScript)
            	return;
            scripts.Add(new ScriptReference(CultureManager.ResolveEmbeddedResourceName("TimeNAction.Scripts.Web.MembershipResources.js"), GetType().Assembly.FullName));
            scripts.Add(new ScriptReference("TimeNAction.Scripts.Web.Membership.js", GetType().Assembly.FullName));
        }
    }
}

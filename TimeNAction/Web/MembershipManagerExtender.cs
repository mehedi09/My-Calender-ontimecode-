using System;
using System.Data;
using System.Collections.Generic;
using System.ComponentModel;
using System.Configuration;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using TimeNAction.Data;

namespace TimeNAction.Web
{
	[TargetControlType(typeof(HtmlGenericControl))]
    [ToolboxItem(false)]
    public class MembershipManagerExtender : AquariumExtenderBase
    {
        
        public MembershipManagerExtender() : 
                base("Web.MembershipManager")
        {
        }
        
        protected override void ConfigureDescriptor(ScriptBehaviorDescriptor descriptor)
        {
        }
        
        protected override void ConfigureScripts(List<ScriptReference> scripts)
        {
            if (EnableCombinedScript)
            	return;
            scripts.Add(new ScriptReference(CultureManager.ResolveEmbeddedResourceName("TimeNAction.Scripts.Web.MembershipResources.js"), GetType().Assembly.FullName));
            scripts.Add(new ScriptReference("TimeNAction.Scripts.Web.MembershipManager.js", GetType().Assembly.FullName));
        }
    }
}

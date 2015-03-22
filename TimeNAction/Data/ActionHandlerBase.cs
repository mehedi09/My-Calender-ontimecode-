using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.XPath;

namespace TimeNAction.Data
{
	/// <summary>
    /// Links a data controller business rule to a method with its implementation.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple=true, Inherited=true)]
    public class RuleAttribute : Attribute
    {
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string _id;
        
        /// <summary>
        /// Links the method to the business rule by its Id.
        /// </summary>
        /// <param name="id">The Id of the data controller business rule.</param>
        public RuleAttribute(string id)
        {
            this.Id = id;
        }
        
        /// <summary>
        /// The Id of the data controller business rule.
        /// </summary>
        public string Id
        {
            get
            {
                return this._id;
            }
            set
            {
                this._id = value;
            }
        }
    }
    
    public class ActionHandlerBase : TimeNAction.Data.IActionHandler
    {
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private ActionArgs _arguments;
        
        private ActionResult _result;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string _whitelist;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string _blacklist;
        
        public ActionArgs Arguments
        {
            get
            {
                return this._arguments;
            }
            set
            {
                this._arguments = value;
            }
        }
        
        public ActionResult Result
        {
            get
            {
                if (_result == null)
                	_result = new ActionResult();
                return _result;
            }
            set
            {
                _result = value;
            }
        }
        
        public string Whitelist
        {
            get
            {
                return this._whitelist;
            }
            set
            {
                this._whitelist = value;
            }
        }
        
        public string Blacklist
        {
            get
            {
                return this._blacklist;
            }
            set
            {
                this._blacklist = value;
            }
        }
        
        public void PreventDefault()
        {
            if (_result != null)
            	_result.Canceled = true;
        }
        
        protected void AddToWhitelist(string rule)
        {
            _whitelist = UpdateNameList(_whitelist, rule, true);
        }
        
        protected void RemoveFromWhitelist(string rule)
        {
            _whitelist = UpdateNameList(_whitelist, rule, false);
        }
        
        protected void AddToBlacklist(string rule)
        {
            _blacklist = UpdateNameList(_blacklist, rule, true);
        }
        
        protected void RemoveFromBlacklist(string rule)
        {
            _blacklist = UpdateNameList(_blacklist, rule, false);
        }
        
        private string UpdateNameList(string listOfNames, string name, bool add)
        {
            if (listOfNames == null)
            	listOfNames = String.Empty;
            List<string> nameList = new List<string>(Regex.Split(listOfNames, "(\\s*(,|;)\\s*)"));
            if (!(add))
            	nameList.Remove(name);
            else
            	if (!(nameList.Contains(name)))
                	nameList.Add(name);
            StringBuilder sb = new StringBuilder();
            foreach (string s in nameList)
            	if (!(String.IsNullOrEmpty(s)))
                {
                    if (sb.Length > 0)
                    	sb.Append(",");
                    sb.Append(s);
                }
            return sb.ToString();
        }
        
        [System.Diagnostics.DebuggerStepThrough()]
        protected virtual void ExecuteMethod(ActionArgs args, ActionResult result, ActionPhase phase)
        {
            bool match = InternalExecuteMethod(args, result, phase, true, true);
            if (!(match))
            	match = InternalExecuteMethod(args, result, phase, true, false);
            if (!(match))
            	match = InternalExecuteMethod(args, result, phase, false, true);
            if (!(match))
            	InternalExecuteMethod(args, result, phase, false, false);
        }
        
        private bool InternalExecuteMethod(ActionArgs args, ActionResult result, ActionPhase phase, bool viewMatch, bool argumentMatch)
        {
            _arguments = args;
            _result = result;
            bool success = false;
            MethodInfo[] methods = GetType().GetMethods((BindingFlags.Public | (BindingFlags.NonPublic | BindingFlags.Instance)));
            foreach (MethodInfo method in methods)
            {
                object[] filters = method.GetCustomAttributes(typeof(ControllerActionAttribute), true);
                foreach (ControllerActionAttribute action in filters)
                	if (((action.Controller == args.Controller) || (!(String.IsNullOrEmpty(args.Controller)) && Regex.IsMatch(args.Controller, action.Controller))) && ((!(viewMatch) && String.IsNullOrEmpty(action.View)) || (action.View == args.View)))
                    {
                        if ((action.CommandName == args.CommandName) && ((!(argumentMatch) && String.IsNullOrEmpty(action.CommandArgument)) || (action.CommandArgument == args.CommandArgument)))
                        {
                            if (action.Phase == phase)
                            {
                                ParameterInfo[] parameters = method.GetParameters();
                                if ((parameters.Length == 2) && ((parameters[0].ParameterType == typeof(ActionArgs)) && (parameters[1].ParameterType == typeof(ActionResult))))
                                	method.Invoke(this, new object[] {
                                                args,
                                                result});
                                else
                                {
                                    object[] arguments = new object[parameters.Length];
                                    for (int i = 0; (i < parameters.Length); i++)
                                    {
                                        ParameterInfo p = parameters[i];
                                        FieldValue v = SelectFieldValueObject(p.Name);
                                        if (v != null)
                                        	if (p.ParameterType.Equals(typeof(FieldValue)))
                                            	arguments[i] = v;
                                            else
                                            	try
                                                {
                                                    arguments[i] = DataControllerBase.ConvertToType(p.ParameterType, v.Value);
                                                }
                                                catch (Exception )
                                                {
                                                }
                                    }
                                    method.Invoke(this, arguments);
                                    success = true;
                                }
                            }
                        }
                    }
            }
            return success;
        }
        
        protected virtual void BeforeSqlAction(ActionArgs args, ActionResult result)
        {
        }
        
        protected virtual void AfterSqlAction(ActionArgs args, ActionResult result)
        {
        }
        
        protected virtual void ExecuteAction(ActionArgs args, ActionResult result)
        {
        }
        
        void IActionHandler.BeforeSqlAction(ActionArgs args, ActionResult result)
        {
            ExecuteMethod(args, result, ActionPhase.Before);
            BeforeSqlAction(args, result);
        }
        
        void IActionHandler.AfterSqlAction(ActionArgs args, ActionResult result)
        {
            ExecuteMethod(args, result, ActionPhase.After);
            AfterSqlAction(args, result);
        }
        
        void IActionHandler.ExecuteAction(ActionArgs args, ActionResult result)
        {
            ExecuteMethod(args, result, ActionPhase.Execute);
            ExecuteAction(args, result);
        }
        
        public virtual FieldValue SelectFieldValueObject(string name)
        {
            return null;
        }
        
        protected virtual bool BuildingDataRows()
        {
            return false;
        }
        
        protected virtual void ExecuteRule(XPathNavigator rule)
        {
            ExecuteRule(rule.GetAttribute("id", String.Empty));
        }
        
        protected virtual void BlockRule(string id)
        {
            if (!(BuildingDataRows()))
            	AddToBlacklist(id);
        }
        
        protected virtual void ExecuteRule(string ruleId)
        {
            MethodInfo[] methods = GetType().GetMethods((BindingFlags.Public | (BindingFlags.NonPublic | BindingFlags.Instance)));
            foreach (MethodInfo method in methods)
            {
                object[] ruleBindings = method.GetCustomAttributes(typeof(RuleAttribute), true);
                foreach (RuleAttribute ra in ruleBindings)
                	if (ra.Id == ruleId)
                    {
                        BlockRule(ruleId);
                        ParameterInfo[] parameters = method.GetParameters();
                        object[] arguments = new object[parameters.Length];
                        for (int i = 0; (i < parameters.Length); i++)
                        {
                            ParameterInfo p = parameters[i];
                            FieldValue v = SelectFieldValueObject(p.Name);
                            if (v != null)
                            	if (p.ParameterType.Equals(typeof(FieldValue)))
                                	arguments[i] = v;
                                else
                                	try
                                    {
                                        arguments[i] = DataControllerBase.ConvertToType(p.ParameterType, v.Value);
                                    }
                                    catch (Exception )
                                    {
                                    }
                        }
                        method.Invoke(this, arguments);
                    }
            }
        }
        
        /// <summary>
        /// Returns True if there are no field values with errors.
        /// </summary>
        /// <returns>True if all field values have a blank 'Error' property.</returns>
        protected bool ValidateInput()
        {
            if (Arguments != null)
            	foreach (FieldValue v in Arguments.Values)
                	if (!(String.IsNullOrEmpty(v.Error)))
                    	return false;
            return true;
        }
    }
}

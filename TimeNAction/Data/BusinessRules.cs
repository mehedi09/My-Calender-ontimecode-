using System;
using System.Collections;
using System.Collections.Generic;
using System.Configuration;
using System.ComponentModel;
using System.Data;
using System.Data.Common;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Text.RegularExpressions;
using System.Reflection;
using System.Xml;
using System.Xml.XPath;
using TimeNAction.Handlers;

namespace TimeNAction.Data
{
	public enum ActionPhase
    {
        
        Execute,
        
        Before,
        
        After,
    }
    
    [AttributeUsage(AttributeTargets.Property, AllowMultiple=true, Inherited=true)]
    public class OverrideWhenAttribute : Attribute
    {
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string _controller;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string _view;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string _virtualView;
        
        public OverrideWhenAttribute(string controller, string view, string virtualView)
        {
            _controller = controller;
            _view = view;
            _virtualView = virtualView;
        }
        
        public string Controller
        {
            get
            {
                return this._controller;
            }
            set
            {
                this._controller = value;
            }
        }
        
        public string View
        {
            get
            {
                return this._view;
            }
            set
            {
                this._view = value;
            }
        }
        
        public string VirtualView
        {
            get
            {
                return this._virtualView;
            }
            set
            {
                this._virtualView = value;
            }
        }
    }
    
    /// <summary>
    /// Specifies the data controller, view, action command name, and other parameters that will cause execution of the method.
    /// Method arguments will have a value if the argument name is matched to a field value passed from the client.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple=true, Inherited=true)]
    public class ControllerActionAttribute : Attribute
    {
        
        private string _commandName;
        
        private string _commandArgument;
        
        private string _controller;
        
        private string _view;
        
        private ActionPhase _phase;
        
        public ControllerActionAttribute(string controller, string commandName, string commandArgument) : 
                this(controller, null, commandName, commandArgument, ActionPhase.Execute)
        {
        }
        
        public ControllerActionAttribute(string controller, string commandName, ActionPhase phase) : 
                this(controller, null, commandName, phase)
        {
        }
        
        public ControllerActionAttribute(string controller, string view, string commandName, ActionPhase phase) : 
                this(controller, view, commandName, String.Empty, phase)
        {
        }
        
        public ControllerActionAttribute(string controller, string view, string commandName, string commandArgument, ActionPhase phase)
        {
            this._controller = controller;
            this._view = view;
            this._commandName = commandName;
            this._commandArgument = commandArgument;
            this._phase = phase;
        }
        
        public string CommandName
        {
            get
            {
                return _commandName;
            }
        }
        
        public string CommandArgument
        {
            get
            {
                return _commandArgument;
            }
        }
        
        public string Controller
        {
            get
            {
                return _controller;
            }
        }
        
        public string View
        {
            get
            {
                return _view;
            }
        }
        
        public ActionPhase Phase
        {
            get
            {
                return _phase;
            }
        }
    }
    
    public enum RowKind
    {
        
        New,
        
        Existing,
    }
    
    [AttributeUsage(AttributeTargets.Method, AllowMultiple=true)]
    public class RowBuilderAttribute : Attribute
    {
        
        private string _controller;
        
        private string _view;
        
        private RowKind _kind;
        
        public RowBuilderAttribute(string controller, RowKind kind) : 
                this(controller, null, kind)
        {
        }
        
        public RowBuilderAttribute(string controller, string view, RowKind kind)
        {
            this._controller = controller;
            this._view = view;
            this._kind = kind;
        }
        
        public string Controller
        {
            get
            {
                return _controller;
            }
        }
        
        public string View
        {
            get
            {
                return _view;
            }
        }
        
        public RowKind Kind
        {
            get
            {
                return _kind;
            }
        }
    }
    
    public enum RowFilterOperation
    {
        
        None,
        
        Equals,
        
        DoesNotEqual,
        
        Equal,
        
        NotEqual,
        
        LessThan,
        
        LessThanOrEqual,
        
        GreaterThan,
        
        GreaterThanOrEqual,
        
        Between,
        
        Like,
        
        Contains,
        
        BeginsWith,
        
        Includes,
        
        DoesNotInclude,
        
        DoesNotBeginWith,
        
        DoesNotContain,
        
        EndsWith,
        
        DoesNotEndWith,
        
        True,
        
        False,
        
        Tomorrow,
        
        Today,
        
        Yesterday,
        
        NextWeek,
        
        ThisWeek,
        
        LastWeek,
        
        NextMonth,
        
        ThisMonth,
        
        LastMonth,
        
        NextQuarter,
        
        ThisQuarter,
        
        LastQuarter,
        
        NextYear,
        
        ThisYear,
        
        YearToDate,
        
        LastYear,
        
        Past,
        
        Future,
        
        Quarter1,
        
        Quarter2,
        
        Quarter3,
        
        Quarter4,
        
        Month1,
        
        Month2,
        
        Month3,
        
        Month4,
        
        Month5,
        
        Month6,
        
        Month7,
        
        Month8,
        
        Month9,
        
        Month10,
        
        Month11,
        
        Month12,
    }
    
    [AttributeUsage(AttributeTargets.Property, AllowMultiple=true)]
    public class RowFilterAttribute : Attribute
    {
        
        public static string[] ComparisonOperations = new string[] {
                String.Empty,
                "=",
                "<>",
                "=",
                "<>",
                "<",
                "<=",
                ">",
                ">=",
                "$between$",
                "*",
                "$contains$",
                "$beginswith$",
                "$in$",
                "$notin$",
                "$doesnotbeginwith$",
                "$doesnotcontain$",
                "$endswith$",
                "$doesnotendwith$",
                "$true$",
                "$false$",
                "$tomorrow$",
                "$today$",
                "$yesterday$",
                "$nextweek$",
                "$thisweek$",
                "$nextmonth$",
                "$thismonth$",
                "$lastmonth$",
                "$nextquarter$",
                "$thisquarter$",
                "$lastquarter$",
                "$nextyear$",
                "$thisyear$",
                "$yeartodate$",
                "$lastyear$",
                "$past$",
                "$future$",
                "$quarter1$",
                "$quarter2$",
                "$quarter3$",
                "$quarter4$",
                "$month1$",
                "$month2$",
                "$month3$",
                "$month4$",
                "$month5$",
                "$month6$",
                "$month7$",
                "$month8$",
                "$month9$",
                "$month10$",
                "$month11$",
                "$month12$"};
        
        private string _controller;
        
        private string _view;
        
        private string _fieldName;
        
        private RowFilterOperation _operation;
        
        public RowFilterAttribute(string controller, string view) : 
                this(controller, view, null)
        {
        }
        
        public RowFilterAttribute(string controller, string view, string fieldName) : 
                this(controller, view, fieldName, RowFilterOperation.Equal)
        {
        }
        
        public RowFilterAttribute(string controller, string view, string fieldName, RowFilterOperation operation)
        {
            this._controller = controller;
            this._view = view;
            this._fieldName = fieldName;
            _operation = operation;
        }
        
        public string Controller
        {
            get
            {
                return _controller;
            }
        }
        
        public string View
        {
            get
            {
                return _view;
            }
        }
        
        public string FieldName
        {
            get
            {
                return _fieldName;
            }
        }
        
        public RowFilterOperation Operation
        {
            get
            {
                return _operation;
            }
        }
        
        public string OperationAsText()
        {
            return ComparisonOperations[Convert.ToInt32(Operation)];
        }
    }
    
    public class ParameterValue
    {
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string _name;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private object _value;
        
        public ParameterValue(string name, object value)
        {
            this.Name = name;
            this.Value = value;
        }
        
        public string Name
        {
            get
            {
                return this._name;
            }
            set
            {
                this._name = value;
            }
        }
        
        public object Value
        {
            get
            {
                return this._value;
            }
            set
            {
                this._value = value;
            }
        }
    }
    
    public class FilterValue
    {
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string _filterOperation;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string _name;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private List<object> _values;
        
        public FilterValue(string fieldName, RowFilterOperation operation) : 
                this(fieldName, operation, DBNull.Value)
        {
        }
        
        public FilterValue(string fieldName, RowFilterOperation operation, params System.Object[] value) : 
                this(fieldName, RowFilterAttribute.ComparisonOperations[((int)(operation))], value)
        {
        }
        
        public FilterValue(string fieldName, string operation, object value)
        {
            this._name = fieldName;
            this._filterOperation = operation;
            _values = new List<object>();
            if ((value != null) && (typeof(System.Collections.IEnumerable).IsInstanceOfType(value) && !(typeof(string).IsInstanceOfType(value))))
            	_values.AddRange(((IEnumerable<object>)(value)));
            else
            	_values.Add(value);
        }
        
        public RowFilterOperation FilterOperation
        {
            get
            {
                int index = Array.IndexOf(RowFilterAttribute.ComparisonOperations, _filterOperation);
                if (index == -1)
                	index = 0;
                return ((RowFilterOperation)(index));
            }
        }
        
        public string Name
        {
            get
            {
                if (this._filterOperation == "~")
                	return String.Empty;
                return _name;
            }
        }
        
        public object Value
        {
            get
            {
                if (_values == null)
                	return null;
                return Values[0];
            }
        }
        
        public object[] Values
        {
            get
            {
                return this._values.ToArray();
            }
        }
        
        public void AddValue(object value)
        {
            _values.Add(value);
        }
    }
    
    public class RowFilterContext
    {
        
        private string _controller;
        
        private string _view;
        
        private string _lookupContextController;
        
        private string _lookupContextView;
        
        private string _lookupContextFieldName;
        
        private bool _canceled;
        
        public RowFilterContext(string controller, string view, string lookupContextController, string lookupContextView, string lookupContextFieldName)
        {
            this.Controller = controller;
            this.View = view;
            this.LookupContextController = lookupContextController;
            this.LookupContextView = lookupContextView;
            this.LookupContextFieldName = lookupContextFieldName;
        }
        
        public string Controller
        {
            get
            {
                return _controller;
            }
            set
            {
                _controller = value;
            }
        }
        
        public string View
        {
            get
            {
                return _view;
            }
            set
            {
                _view = value;
            }
        }
        
        public string LookupContextController
        {
            get
            {
                return _lookupContextController;
            }
            set
            {
                _lookupContextController = value;
            }
        }
        
        public string LookupContextView
        {
            get
            {
                return _lookupContextView;
            }
            set
            {
                _lookupContextView = value;
            }
        }
        
        public string LookupContextFieldName
        {
            get
            {
                return _lookupContextFieldName;
            }
            set
            {
                _lookupContextFieldName = value;
            }
        }
        
        public bool Canceled
        {
            get
            {
                return _canceled;
            }
            set
            {
                _canceled = value;
            }
        }
    }
    
    public enum AccessPermission
    {
        
        Allow,
        
        Deny,
    }
    
    [AttributeUsage(AttributeTargets.Method, AllowMultiple=true)]
    public class AccessControlAttribute : Attribute
    {
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string _controller;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string _fieldName;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private AccessPermission _permission;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string _sql;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private List<SqlParam> _parameters;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private List<object> _restrictions;
        
        public AccessControlAttribute(string fieldName) : 
                this(String.Empty, fieldName)
        {
        }
        
        public AccessControlAttribute(string fieldName, AccessPermission permission) : 
                this(String.Empty, fieldName, permission)
        {
        }
        
        public AccessControlAttribute(string controller, string fieldName) : 
                this(controller, fieldName, AccessPermission.Allow)
        {
        }
        
        public AccessControlAttribute(string controller, string fieldName, AccessPermission permission) : 
                this(controller, fieldName, String.Empty, permission)
        {
        }
        
        public AccessControlAttribute(string controller, string fieldName, string sql) : 
                this(controller, fieldName, sql, AccessPermission.Allow)
        {
        }
        
        public AccessControlAttribute(string controller, string fieldName, string sql, AccessPermission permission)
        {
            this._controller = controller;
            this._fieldName = fieldName;
            this._permission = permission;
            this._sql = sql;
        }
        
        public string Controller
        {
            get
            {
                return this._controller;
            }
            set
            {
                this._controller = value;
            }
        }
        
        public string FieldName
        {
            get
            {
                return this._fieldName;
            }
            set
            {
                this._fieldName = value;
            }
        }
        
        public AccessPermission Permission
        {
            get
            {
                return this._permission;
            }
            set
            {
                this._permission = value;
            }
        }
        
        public string Sql
        {
            get
            {
                return this._sql;
            }
            set
            {
                this._sql = value;
            }
        }
        
        public List<SqlParam> Parameters
        {
            get
            {
                return this._parameters;
            }
            set
            {
                this._parameters = value;
            }
        }
        
        public List<object> Restrictions
        {
            get
            {
                return this._restrictions;
            }
            set
            {
                this._restrictions = value;
            }
        }
    }
    
    public partial class BusinessRules : BusinessRulesBase
    {
    }
    
    public class BusinessRulesBase : ActionHandlerBase, TimeNAction.Data.IRowHandler, TimeNAction.Data.IDataFilter, TimeNAction.Data.IDataFilter2
    {
        
        private MethodInfo[] _newRow;
        
        private MethodInfo[] _prepareRow;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private ControllerConfiguration _config;
        
        private string _controllerName;
        
        private object[] _row;
        
        private PageRequest _request;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private ViewPage _page;
        
        private RowFilterContext _rowFilter;
        
        private string _userEmail;
        
        private string[] _requestFilter;
        
        private FieldValue[] _requestExternalFilter;
        
        public static Regex SqlFieldFilterOperationRegex = new Regex("^(?\'Name\'\\w+?)_Filter_((?\'Operation\'\\w+?)(?\'Index\'\\d*))?$");
        
        public static string[] SystemSqlParameters = new string[] {
                "BusinessRules_PreventDefault",
                "Result_Continue",
                "Result_Refresh",
                "Result_RefreshChildren",
                "Result_ShowAlert",
                "Result_ShowMessage",
                "Result_ShowViewMessage",
                "Result_Focus",
                "Result_Error",
                "Result_ExecuteOnClient",
                "Result_NavigateUrl"};
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private bool _requiresRowCount;
        
        public Regex SystemSqlPropertyRegex = new Regex("^(BusinessRules|Session|Url|Arguments)_");
        
        private SortedDictionary<string, string> _actionParameters;
        
        private string _actionParametersData;
        
        public ControllerConfiguration Config
        {
            get
            {
                return this._config;
            }
            set
            {
                this._config = value;
            }
        }
        
        public string ControllerName
        {
            get
            {
                return _controllerName;
            }
            set
            {
                _controllerName = value;
            }
        }
        
        public object[] Row
        {
            get
            {
                return _row;
            }
        }
        
        public PageRequest Request
        {
            get
            {
                return _request;
            }
        }
        
        public ViewPage Page
        {
            get
            {
                return this._page;
            }
            set
            {
                this._page = value;
            }
        }
        
        protected System.Web.HttpContext Context
        {
            get
            {
                return System.Web.HttpContext.Current;
            }
        }
        
        public RowFilterContext RowFilter
        {
            get
            {
                return _rowFilter;
            }
        }
        
        public string LookupContextController
        {
            get
            {
                if (PageRequest.Current != null)
                	return PageRequest.Current.LookupContextController;
                if (DistinctValueRequest.Current != null)
                	return DistinctValueRequest.Current.LookupContextController;
                return null;
            }
        }
        
        public string LookupContextView
        {
            get
            {
                if (PageRequest.Current != null)
                	return PageRequest.Current.LookupContextView;
                if (DistinctValueRequest.Current != null)
                	return DistinctValueRequest.Current.LookupContextView;
                return null;
            }
        }
        
        public string LookupContextFieldName
        {
            get
            {
                if (PageRequest.Current != null)
                	return PageRequest.Current.LookupContextFieldName;
                if (DistinctValueRequest.Current != null)
                	return DistinctValueRequest.Current.LookupContextFieldName;
                return null;
            }
        }
        
        protected string[] TagList
        {
            get
            {
                string t = Tags;
                if (String.IsNullOrEmpty(t))
                	t = String.Empty;
                return t.Split(new char[] {
                            ','}, StringSplitOptions.RemoveEmptyEntries);
            }
            set
            {
                StringBuilder sb = new StringBuilder();
                if (value != null)
                	foreach (string s in value)
                    {
                        if (sb.Length > 0)
                        	sb.Append(",");
                        sb.Append(s);
                    }
                Tags = sb.ToString();
            }
        }
        
        public static string UserName
        {
            get
            {
                return System.Web.HttpContext.Current.User.Identity.Name;
            }
        }
        
        public virtual string UserEmail
        {
            get
            {
                if (!(String.IsNullOrEmpty(_userEmail)))
                	return _userEmail;
                if (!((System.Web.HttpContext.Current.User.Identity.GetType() == typeof(System.Security.Principal.WindowsIdentity))))
                	return System.Web.Security.Membership.GetUser().Email;
                return null;
            }
            set
            {
                _userEmail = value;
            }
        }
        
        public static object UserId
        {
            get
            {
                if (System.Web.HttpContext.Current.User.Identity.GetType() == typeof(System.Security.Principal.WindowsIdentity))
                	return System.Security.Principal.WindowsIdentity.GetCurrent().User.Value;
                else
                	return System.Web.Security.Membership.GetUser().ProviderUserKey;
            }
        }
        
        public string QuickFindFilter
        {
            get
            {
                if (this._requestFilter != null)
                	foreach (string filterExpression in this._requestFilter)
                    {
                        Match filterMatch = Controller.FilterExpressionRegex.Match(filterExpression);
                        if (filterMatch.Success)
                        {
                            Match valueMatch = Controller.FilterValueRegex.Match(filterMatch.Groups["Values"].Value);
                            if (valueMatch.Success && (valueMatch.Groups["Operation"].Value == "~"))
                            	return Convert.ToString(Controller.StringToValue(valueMatch.Groups["Value"].Value));
                        }
                    }
                return null;
            }
        }
        
        public string Tags
        {
            get
            {
                if (Page != null)
                	return Page.Tag;
                if (Arguments != null)
                {
                    if (Result.Tag == null)
                    	Result.Tag = Arguments.Tag;
                    return Result.Tag;
                }
                if (PageRequest.Current != null)
                	return PageRequest.Current.Tag;
                if (DistinctValueRequest.Current != null)
                	return DistinctValueRequest.Current.Tag;
                return null;
            }
            set
            {
                if (Page != null)
                	Page.Tag = value;
                else
                	if (Result != null)
                    	Result.Tag = value;
            }
        }
        
        /// <summary>
        /// Specfies if the the currently processed "Select" action must calculate the number of available data rows.
        /// </summary>
        public bool RequiresRowCount
        {
            get
            {
                return this._requiresRowCount;
            }
            set
            {
                this._requiresRowCount = value;
            }
        }
        
        /// <summary>
        /// Returns the name of the View that was active when the currently processed action has been invoked.
        /// </summary>
        public string View
        {
            get
            {
                if (_request != null)
                	return _request.View;
                if (Arguments != null)
                	return Arguments.View;
                return null;
            }
        }
        
        public SortedDictionary<string, string> ActionParameters
        {
            get
            {
                if (_actionParameters == null)
                {
                    _actionParameters = new SortedDictionary<string, string>();
                    string data = _actionParametersData;
                    if (String.IsNullOrEmpty(data))
                    	data = ActionData;
                    if (!(String.IsNullOrEmpty(data)))
                    {
                        data = ReplaceFieldNamesWithValues(Regex.Replace(data, "^(?\'Name\'[\\w-]+)\\s*:\\s*(?\'Value\'.+?)\\s*$", DoReplaceActionParameter, RegexOptions.Multiline));
                        _actionParameters.Add(String.Empty, data.Trim());
                    }
                }
                return _actionParameters;
            }
        }
        
        /// <summary>
        /// The value of the 'Data' property of the currently processed action as defined in the data controller.
        /// </summary>
        public string ActionData
        {
            get
            {
                if (Arguments != null)
                	return Config.ReadActionData(Arguments.Path);
                return null;
            }
        }
        
        public virtual string Localize(string token, string text)
        {
            return Localizer.Replace("Controllers", (ControllerName + ".xml"), token, text);
        }
        
        public bool IsOverrideApplicable(string controller, string view, string virtualView)
        {
            foreach (PropertyInfo p in GetType().GetProperties(((BindingFlags.Public | BindingFlags.NonPublic) | BindingFlags.Instance)))
            	foreach (OverrideWhenAttribute filter in p.GetCustomAttributes(typeof(OverrideWhenAttribute), true))
                	if (((filter.Controller == controller) && (filter.View == view)) && (filter.VirtualView == virtualView))
                    {
                        object v = p.GetValue(this, null);
                        return ((v is bool) && ((bool)(v)));
                    }
            return false;
        }
        
        private MethodInfo[] FindRowHandler(PageRequest request, RowKind kind)
        {
            List<MethodInfo> list = new List<MethodInfo>();
            foreach (MethodInfo method in GetType().GetMethods((BindingFlags.Public | (BindingFlags.NonPublic | BindingFlags.Instance))))
            	foreach (RowBuilderAttribute filter in method.GetCustomAttributes(typeof(RowBuilderAttribute), true))
                	if (filter.Kind == kind)
                    {
                        if (((request.Controller == filter.Controller) || Regex.IsMatch(request.Controller, filter.Controller)) && (String.IsNullOrEmpty(filter.View) || (request.View == filter.View)))
                        	list.Add(method);
                    }
            return list.ToArray();
        }
        
        bool IRowHandler.SupportsNewRow(PageRequest request)
        {
            _newRow = FindRowHandler(request, RowKind.New);
            return (_newRow.Length > 0);
        }
        
        void IRowHandler.NewRow(PageRequest request, ViewPage page, object[] row)
        {
            if (_newRow != null)
            {
                this._request = request;
                this._page = page;
                this._row = row;
                foreach (MethodInfo method in _newRow)
                	method.Invoke(this, new object[0]);
            }
        }
        
        bool IRowHandler.SupportsPrepareRow(PageRequest request)
        {
            _prepareRow = FindRowHandler(request, RowKind.Existing);
            return (_prepareRow.Length > 0);
        }
        
        void IRowHandler.PrepareRow(PageRequest request, ViewPage page, object[] row)
        {
            if (_prepareRow != null)
            {
                this._request = request;
                this._page = page;
                this._row = row;
                foreach (MethodInfo method in _prepareRow)
                	method.Invoke(this, new object[0]);
            }
        }
        
        public virtual void ProcessPageRequest(PageRequest request, ViewPage page)
        {
        }
        
        public static List<string> ValueToList(string v)
        {
            if (String.IsNullOrEmpty(v))
            	return new List<string>();
            return new List<string>(v.Split(','));
        }
        
        public object SelectFieldValue(string name)
        {
            return SelectFieldValue(name, true);
        }
        
        public static bool ListsAreEqual(List<string> list1, List<string> list2)
        {
            if (list1.Count != list2.Count)
            	return false;
            foreach (string s in list1)
            	if (!(list2.Contains(s)))
                	return false;
            return true;
        }
        
        public static bool ListsAreEqual(string list1, string list2)
        {
            return ListsAreEqual(ValueToList(list1), ValueToList(list2));
        }
        
        public object SelectFieldValue(string name, bool useExternalValues)
        {
            object v = null;
            if ((_page != null) && (_row != null))
            	v = _page.SelectFieldValue(name, _row);
            else
            	if (Arguments != null)
                	foreach (FieldValue av in Arguments.Values)
                    	if (av.Name.Equals(name, StringComparison.InvariantCultureIgnoreCase))
                        	return av.Value;
            if ((v == null) && useExternalValues)
            	v = SelectExternalFilterFieldValue(name);
            return v;
        }
        
        protected override bool BuildingDataRows()
        {
            return ((_page != null) && (_row != null));
        }
        
        public override FieldValue SelectFieldValueObject(string name)
        {
            FieldValue result = null;
            if (this.Arguments != null)
            	result = this.Arguments[name];
            if (((result == null) && BuildingDataRows()) && ((this.Request != null) && !(this.Request.Inserting)))
            	result = _page.SelectFieldValueObject(name, _row);
            if (result == null)
            	result = SelectExternalFilterFieldValueObject(name);
            return result;
        }
        
        public void UpdateFieldValue(string name, object value)
        {
            if (DBNull.Value.Equals(value))
            	value = null;
            if ((_page != null) && (_row != null))
            	_page.UpdateFieldValue(name, _row, value);
            else
            {
                if (Result != null)
                	Result.Values.Add(new FieldValue(name, value));
                if (Arguments != null)
                {
                    FieldValue v = SelectFieldValueObject(name);
                    if (v != null)
                    {
                        v.NewValue = value;
                        v.Modified = true;
                    }
                }
            }
        }
        
        public object SelectExternalFilterFieldValue(string name)
        {
            FieldValue v = SelectExternalFilterFieldValueObject(name);
            if (v != null)
            	return v.Value;
            return null;
        }
        
        public FieldValue SelectExternalFilterFieldValueObject(string name)
        {
            FieldValue[] values = null;
            if (Request != null)
            	values = Request.ExternalFilter;
            else
            	if (Arguments != null)
                	values = Arguments.ExternalFilter;
            if (values == null)
            	values = this._requestExternalFilter;
            if (values != null)
            	for (int i = 0; (i < values.Length); i++)
                	if (values[i].Name.Equals(name, StringComparison.InvariantCultureIgnoreCase))
                    	return values[i];
            return null;
        }
        
        public void PopulateManyToManyField(string fieldName, string primaryKeyField, string targetController, string targetForeignKey1, string targetForeignKey2)
        {
            string filter = String.Format("{0}:={1}", targetForeignKey1, SelectFieldValue(primaryKeyField));
            PageRequest request = new PageRequest(0, 300, null, new string[] {
                        filter});
            request.RequiresMetaData = true;
            ViewPage page = ControllerFactory.CreateDataController().GetPage(targetController, null, request);
            StringBuilder sb = new StringBuilder();
            foreach (object[] row in page.Rows)
            {
                if (sb.Length > 0)
                	sb.Append(",");
                sb.Append(page.SelectFieldValue(targetForeignKey2, row));
            }
            UpdateFieldValue(fieldName, sb.ToString());
        }
        
        public void UpdateManyToManyField(string fieldName, string primaryKeyField, string targetController, string targetForeignKey1, string targetForeignKey2)
        {
            FieldValue field = SelectFieldValueObject(fieldName);
            if (field == null)
            	return;
            object primaryKey = SelectFieldValue(primaryKeyField);
            List<string> oldValues = ValueToList(((string)(field.OldValue)));
            List<string> newValues = ValueToList(((string)(field.NewValue)));
            if (!(ListsAreEqual(oldValues, newValues)))
            {
                IDataController controller = ControllerFactory.CreateDataController();
                foreach (string s in oldValues)
                	if (!(newValues.Contains(s)))
                    {
                        ActionArgs args = new ActionArgs();
                        args.Controller = targetController;
                        args.CommandName = "Delete";
                        args.LastCommandName = "Select";
                        args.Values = new FieldValue[] {
                                new FieldValue(targetForeignKey1, primaryKey, primaryKey),
                                new FieldValue(targetForeignKey2, s, s),
                                new FieldValue("_IgnorePrimaryKeyInWhere", true)};
                        ActionResult result = controller.Execute(targetController, null, args);
                        result.RaiseExceptionIfErrors();
                    }
                foreach (string s in newValues)
                	if (!(oldValues.Contains(s)))
                    {
                        ActionArgs args = new ActionArgs();
                        args.Controller = targetController;
                        args.CommandName = "Insert";
                        args.LastCommandName = "New";
                        args.Values = new FieldValue[] {
                                new FieldValue(targetForeignKey1, primaryKey),
                                new FieldValue(targetForeignKey2, s)};
                        ActionResult result = controller.Execute(targetController, null, args);
                        result.RaiseExceptionIfErrors();
                    }
            }
        }
        
        public void ClearManyToManyField(string fieldName, string primaryKeyField, string targetController, string targetForeignKey1, string targetForeignKey2)
        {
            FieldValue v = SelectFieldValueObject(fieldName);
            if (v != null)
            {
                v.NewValue = null;
                v.Modified = true;
            }
            UpdateManyToManyField(fieldName, primaryKeyField, targetController, targetForeignKey1, targetForeignKey2);
        }
        
        void IDataFilter.Filter(SortedDictionary<string, object> filter)
        {
            // do nothing
        }
        
        void IDataFilter2.Filter(string controller, string view, SortedDictionary<string, object> filter)
        {
            this.Filter(controller, view, filter);
        }
        
        protected virtual void Filter(string controller, string view, SortedDictionary<string, object> filter)
        {
            foreach (PropertyInfo p in GetType().GetProperties((BindingFlags.Public | (BindingFlags.NonPublic | BindingFlags.Instance))))
            	foreach (RowFilterAttribute rowFilter in p.GetCustomAttributes(typeof(RowFilterAttribute), true))
                	if ((controller == rowFilter.Controller) && (String.IsNullOrEmpty(rowFilter.View) || (view == rowFilter.View)))
                    {
                        this.RowFilter.Canceled = false;
                        object v = p.GetValue(this, null);
                        string fieldName = rowFilter.FieldName;
                        if (String.IsNullOrEmpty(fieldName))
                        	fieldName = p.Name;
                        if (!(this.RowFilter.Canceled))
                        {
                            if (typeof(System.Collections.IEnumerable).IsInstanceOfType(v) && !(typeof(String).IsInstanceOfType(v)))
                            {
                                StringBuilder sb = new StringBuilder();
                                foreach (object item in ((System.Collections.IEnumerable)(v)))
                                {
                                    if (sb.Length > 0)
                                    	sb.AppendFormat(rowFilter.OperationAsText());
                                    sb.Append(item);
                                    sb.Append(Convert.ToChar(0));
                                }
                                v = sb.ToString();
                            }
                            if (v == null)
                            	v = "null";
                            string filterExpression = String.Format("{0}{1}", rowFilter.OperationAsText(), v);
                            if (!(filter.ContainsKey(fieldName)))
                            	filter.Add(fieldName, filterExpression);
                            else
                            	filter[fieldName] = String.Format("{0}{1}{2}", filter[fieldName], Convert.ToChar(0), filterExpression);
                        }
                    }
        }
        
        void IDataFilter2.AssignContext(string controller, string view, string lookupContextController, string lookupContextView, string lookupContextFieldName)
        {
            _rowFilter = new RowFilterContext(controller, view, lookupContextController, lookupContextView, lookupContextFieldName);
        }
        
        protected object LastEnteredValue(string controller, string fieldName)
        {
            if (Context == null)
            	return null;
            FieldValue[] values = ((FieldValue[])(Context.Session[String.Format("{0}$LEVs", controller)]));
            if (values != null)
            	foreach (FieldValue v in values)
                	if (v.Name.Equals(fieldName, StringComparison.InvariantCultureIgnoreCase))
                    	return v.Value;
            return null;
        }
        
        /// <summary>
        /// Returns true if the data view on the page is tagged with any of the values specified in the arguments.
        /// </summary>
        /// <param name="tags">The collection of string values representing tag names.</param>
        /// <returns>Returns true if at least one tag specified in the arguments is assigned to the data view.</returns>
        protected bool IsTagged(params System.String[] tags)
        {
            string[] list = TagList;
            foreach (string t in tags)
            	if (Array.IndexOf(list, t) >= 0)
                	return true;
            return false;
        }
        
        protected void AddTag(params System.String[] tags)
        {
            List<string> list = new List<string>(TagList);
            foreach (string t in tags)
            	if (!(list.Contains(t)))
                	list.Add(t);
            TagList = list.ToArray();
        }
        
        protected void RemoveTag(params System.String[] tags)
        {
            List<string> list = new List<string>(TagList);
            foreach (string t in tags)
            	list.Remove(t);
            TagList = list.ToArray();
        }
        
        protected void AddFieldValue(FieldValue v)
        {
            if (Arguments != null)
            {
                List<FieldValue> values = new List<FieldValue>(Arguments.Values);
                values.Add(v);
                Arguments.Values = values.ToArray();
            }
        }
        
        protected void AddFieldValue(string name, object newValue)
        {
            AddFieldValue(new FieldValue(name, newValue));
        }
        
        public void BeforeSelect(DistinctValueRequest request)
        {
            ExecuteServerRules(request, ActionPhase.Before);
            ExecuteSelect(request.Controller, request.View, request.Filter, request.ExternalFilter, ActionPhase.Before, "SelectDistinct");
        }
        
        public void AfterSelect(DistinctValueRequest request)
        {
            ExecuteServerRules(request, ActionPhase.Before);
            ExecuteSelect(request.Controller, request.View, request.Filter, request.ExternalFilter, ActionPhase.After, "SelectDistinct");
        }
        
        public void BeforeSelect(PageRequest request)
        {
            ExecuteServerRules(request, ActionPhase.Before);
            ExecuteSelect(request.Controller, request.View, request.Filter, request.ExternalFilter, ActionPhase.Before, "Select");
        }
        
        public void AfterSelect(PageRequest request)
        {
            ExecuteServerRules(request, ActionPhase.After);
            ExecuteSelect(request.Controller, request.View, request.Filter, request.ExternalFilter, ActionPhase.After, "Select");
        }
        
        public bool IsFiltered(string fieldName, params RowFilterOperation[] operations)
        {
            FilterValue fv = SelectFilterValue(fieldName);
            if (fv != null)
            	foreach (RowFilterOperation op in operations)
                	if (fv.FilterOperation == op)
                    	return true;
            return (fv != null);
        }
        
        public FilterValue SelectFilterValue(string fieldName)
        {
            FilterValue fv = null;
            string[] filters = _requestFilter;
            if ((filters == null) || (filters.Length == 0))
            	filters = Result.Filter;
            if (filters != null)
            	foreach (string filterExpression in filters)
                {
                    Match filterMatch = Controller.FilterExpressionRegex.Match(filterExpression);
                    if (filterMatch.Success)
                    {
                        Match valueMatch = Controller.FilterValueRegex.Match(filterMatch.Groups["Values"].Value);
                        string alias = filterMatch.Groups["Alias"].Value;
                        string operation = valueMatch.Groups["Operation"].Value;
                        if (valueMatch.Success && (alias.Equals(fieldName, StringComparison.InvariantCultureIgnoreCase) && !((operation == "~"))))
                        {
                            string filterValue = valueMatch.Groups["Value"].Value;
                            object v = null;
                            if (!(Controller.StringIsNull(filterValue)))
                            	if (Regex.IsMatch(filterValue, "\\$(or|and)\\$"))
                                {
                                    string[] list = filterValue.Split(new string[] {
                                                "$or$",
                                                "$and$"}, StringSplitOptions.RemoveEmptyEntries);
                                    List<object> values = new List<object>();
                                    foreach (string s in list)
                                    	if (Controller.StringIsNull(s))
                                        	values.Add(null);
                                        else
                                        	values.Add(Controller.StringToValue(s));
                                    v = values.ToArray();
                                }
                                else
                                	v = Controller.StringToValue(filterValue);
                            fv = new FilterValue(alias, operation, v);
                            break;
                        }
                    }
                }
            if ((fv == null) && (_requestExternalFilter != null))
            	foreach (FieldValue v in _requestExternalFilter)
                	if (v.Name.Equals(fieldName, StringComparison.InvariantCultureIgnoreCase))
                    {
                        fv = new FilterValue(fieldName, "=", v.Value);
                        break;
                    }
            return fv;
        }
        
        private void ExecuteSelect(string controllerName, string viewId, string[] filter, FieldValue[] externalFilter, ActionPhase phase, string commandName)
        {
            this._requestFilter = filter;
            this._requestExternalFilter = externalFilter;
            MethodInfo[] methods = GetType().GetMethods((BindingFlags.Public | (BindingFlags.NonPublic | BindingFlags.Instance)));
            foreach (MethodInfo method in methods)
            {
                object[] filters = method.GetCustomAttributes(typeof(ControllerActionAttribute), true);
                foreach (ControllerActionAttribute action in filters)
                	if ((String.IsNullOrEmpty(action.Controller) || ((action.Controller == controllerName) || Regex.IsMatch(controllerName, action.Controller))) && (String.IsNullOrEmpty(action.View) || ((action.View == viewId) || Regex.IsMatch(viewId, action.View))))
                    {
                        if ((action.CommandName == commandName) && (action.Phase == phase))
                        {
                            ParameterInfo[] parameters = method.GetParameters();
                            object[] arguments = new object[parameters.Length];
                            for (int i = 0; (i < parameters.Length); i++)
                            {
                                ParameterInfo p = parameters[i];
                                FilterValue fv = SelectFilterValue(p.Name);
                                if (fv != null)
                                	if (p.ParameterType.Equals(typeof(FilterValue)))
                                    	arguments[i] = fv;
                                    else
                                    	try
                                        {
                                            if (p.ParameterType.IsArray)
                                            {
                                                ArrayList list = new ArrayList();
                                                foreach (object o in fv.Values)
                                                {
                                                    object elemValue = null;
                                                    try
                                                    {
                                                        elemValue = Controller.ConvertToType(p.ParameterType.GetElementType(), o);
                                                    }
                                                    catch (Exception )
                                                    {
                                                    }
                                                    list.Add(elemValue);
                                                }
                                                arguments[i] = list.ToArray(p.ParameterType.GetElementType());
                                            }
                                            else
                                            	arguments[i] = Controller.ConvertToType(p.ParameterType, fv.Value);
                                        }
                                        catch (Exception )
                                        {
                                        }
                            }
                            method.Invoke(this, arguments);
                        }
                    }
            }
        }
        
        protected void ChangeFilter(params FilterValue[] filter)
        {
            ApplyFilter(false, filter);
        }
        
        protected void AssignFilter(params FilterValue[] filter)
        {
            ApplyFilter(true, filter);
        }
        
        private void ApplyFilter(bool replace, params FilterValue[] filter)
        {
            List<string> newFilter = new List<string>();
            if (!(replace))
            {
                List<string> currentFilter = new List<string>();
                if (Page != null)
                	currentFilter.AddRange(Page.Filter);
                else
                	if (Result != null)
                    	currentFilter.AddRange(Result.Filter);
                foreach (FilterValue fv in filter)
                {
                    int i = 0;
                    while (i < currentFilter.Count)
                    	if (currentFilter[i].StartsWith((fv.Name + ":")))
                        {
                            currentFilter.RemoveAt(i);
                            break;
                        }
                        else
                        	i++;
                    newFilter = new List<string>(currentFilter);
                }
            }
            foreach (FilterValue fv in filter)
            {
                string filterValue = "%js%null";
                if (!(DBNull.Value.Equals(fv.Value)))
                {
                    StringBuilder sb = new StringBuilder();
                    string separator = "$or$";
                    if (fv.FilterOperation == RowFilterOperation.Between)
                    	separator = "$and$";
                    foreach (object o in fv.Values)
                    {
                        if (sb.Length > 0)
                        	sb.Append(separator);
                        sb.Append(Controller.ValueToString(o));
                    }
                    filterValue = sb.ToString();
                }
                newFilter.Add(String.Format("{0}:{1}{2}", fv.Name, RowFilterAttribute.ComparisonOperations[((int)(fv.FilterOperation))], filterValue));
            }
            if (_requestExternalFilter != null)
            	foreach (FieldValue v in _requestExternalFilter)
                	newFilter.Add(String.Format("{0}:={1}", v.Name, Controller.ValueToString(v.Value)));
            if (Page != null)
            	Page.ChangeFilter(newFilter.ToArray());
            if (Result != null)
            	Result.Filter = newFilter.ToArray();
        }
        
        public static BusinessRules Create(ControllerConfiguration config)
        {
            Type t = typeof(BusinessRules);
            BusinessRules rules = ((BusinessRules)(t.Assembly.CreateInstance(t.FullName)));
            rules.Config = config;
            return rules;
        }
        
        public void ProcessSpecialActions(ActionArgs args, ActionResult result)
        {
            this.Arguments = args;
            this.Result = result;
            if (((args.SelectedValues != null) && (args.SelectedValues.Length > 0)) && !(((args.LastCommandName == "Edit") || (args.LastCommandName == "New"))))
            {
                List<string> keyFields = new List<string>();
                XPathNodeIterator keyFieldIterator = Config.Select("/c:dataController/c:fields/c:field[@isPrimaryKey=\'true\']/@name");
                while (keyFieldIterator.MoveNext())
                	keyFields.Add(keyFieldIterator.Current.Value);
                foreach (string key in args.SelectedValues)
                {
                    string[] keyValues = key.Split(',');
                    int index = 0;
                    foreach (string fieldName in keyFields)
                    {
                        FieldValue fv = SelectFieldValueObject(fieldName);
                        if (fv != null)
                        {
                            fv.NewValue = keyValues[index];
                            fv.OldValue = fv.NewValue;
                            fv.Modified = false;
                        }
                        index++;
                    }
                    ProcessSpecialActions(args);
                }
            }
            else
            	ProcessSpecialActions(args);
        }
        
        protected virtual void ProcessSpecialActions(ActionArgs args)
        {
            if (args.IgnoreBusinessRules)
            	return;
            ExecuteServerRules(args, Result, ActionPhase.Before);
            if (!(Result.Canceled))
            {
                if (!(String.IsNullOrEmpty(ActionData)))
                {
                    if (args.CommandName == "SQL")
                    	Sql(ActionData);
                }
                ExecuteServerRules(args, Result, ActionPhase.After);
            }
        }
        
        /// <summary>
        /// Executes the SQL statements specified in the 'text' argument. Any parameter referenced in the text is provided with a value if the parameter name is matched to the name of a data field.
        /// </summary>
        /// <param name="text">The text composed of valid SQL statements.
        /// Parameter names can reference data fields as @FieldName, @FieldName_Value, @FieldName_OldValue, and @FieldName_NewValue.
        /// Use the parameter marker supported by the database server.</param>
        /// <param name="parameters">Optional list of parameter values used if a matching data field is not found.</param>
        /// <returns>The number of records affected by execute of SQL statements</returns>
        protected int Sql(string text, params ParameterValue[] parameters)
        {
            return Sql(text, String.Empty, parameters);
        }
        
        protected virtual void CreateSqlParameter(SqlText query, string parameterName, object parameterValue, string fieldType, string fieldLen)
        {
            DbParameter p = query.AddParameter(parameterName, parameterValue);
            if (!(String.IsNullOrEmpty(fieldType)))
            {
                p.Direction = ParameterDirection.InputOutput;
                DataControllerBase.AssignParameterValue(p, fieldType, parameterValue);
                if (!(String.IsNullOrEmpty(fieldLen)))
                	p.Size = Convert.ToInt32(fieldLen);
                else
                	if (fieldType == "String")
                    	p.Direction = ParameterDirection.Input;
                    else
                    	if (fieldType == "Decimal")
                        {
                            ((IDbDataParameter)(p)).Precision = 38;
                            ((IDbDataParameter)(p)).Scale = 10;
                        }
            }
        }
        
        /// <summary>
        /// Executes the SQL statements specified in the 'text' argument. Any parameter referenced in the text is provided with a value if the parameter name is matched to the name of a data field.
        /// </summary>
        /// <param name="text">The text composed of valid SQL statements.
        /// Parameter names can reference data fields as @FieldName, @FieldName_Value, @FieldName_OldValue, and @FieldName_NewValue.
        /// Use the parameter marker supported by the database server.</param>
        /// <param name="connectionStringName">The name of the database connection string.</param>
        /// <param name="parameters">Optional list of parameter values used if a matching data field is not found.</param>
        /// <returns>The number of records affected by execute of SQL statements</returns>
        protected int Sql(string text, string connectionStringName, params ParameterValue[] parameters)
        {
            text = Regex.Replace(text, "(^|\\n).*?Debug\\s+([\\s\\S]+?)End Debug(\\s+|$)", String.Empty, RegexOptions.IgnoreCase);
            bool buildingRow = ((_page != null) && (_row != null));
            List<string> names = new List<string>();
            using (SqlText query = new SqlText(text, connectionStringName))
            {
                Regex paramRegex = new Regex(String.Format("({0}(?\'FieldName\'\\w+?)_(?\'ValueType\'OldValue|NewValue|Value|Modified|FilterValue|" +
                            "FilterOperation|Filter_\\w+))|({0}(?\'FieldName\'\\w+))", Regex.Escape(query.ParameterMarker)), RegexOptions.IgnoreCase);
                Match m = paramRegex.Match(text);
                while (m.Success)
                {
                    string fieldName = m.Groups["FieldName"].Value;
                    string valueType = m.Groups["ValueType"].Value;
                    string paramName = m.Value;
                    if (!(names.Contains(paramName)))
                    {
                        names.Add(paramName);
                        string fieldType = null;
                        string fieldLen = null;
                        if (Config != null)
                        {
                            XPathNavigator fieldNav = Config.SelectSingleNode("/c:dataController/c:fields/c:field[@name=\'{0}\']", fieldName);
                            if (fieldNav != null)
                            {
                                fieldType = fieldNav.GetAttribute("type", String.Empty);
                                fieldLen = fieldNav.GetAttribute("length", String.Empty);
                            }
                        }
                        FieldValue fv = SelectFieldValueObject(fieldName);
                        if (fv != null)
                        {
                            object v = fv.Value;
                            if (valueType == "OldValue")
                            	v = fv.OldValue;
                            else
                            	if (valueType == "NewValue")
                                	v = fv.NewValue;
                                else
                                	if (valueType == "Modified")
                                    {
                                        fieldType = "Boolean";
                                        fieldLen = null;
                                        v = fv.Modified;
                                    }
                            CreateSqlParameter(query, paramName, v, fieldType, fieldLen);
                        }
                        else
                        	if (fieldName.StartsWith("Parameters_"))
                            	CreateSqlParameter(query, paramName, null, "String", null);
                            else
                            	if (valueType.StartsWith("Filter") && !(String.IsNullOrEmpty(fieldType)))
                                {
                                    object v = null;
                                    FilterValue filter = SelectFilterValue(fieldName);
                                    if (filter != null)
                                    {
                                        if (valueType == "FilterValue")
                                        	v = filter.Value;
                                        if (valueType == "FilterOperation")
                                        	v = Convert.ToString(filter.FilterOperation);
                                    }
                                    CreateSqlParameter(query, paramName, v, fieldType, fieldLen);
                                }
                                else
                                {
                                    DataField field = null;
                                    if (buildingRow)
                                    {
                                        field = Page.FindField(fieldName);
                                        if (field != null)
                                        	CreateSqlParameter(query, paramName, _row[Page.Fields.IndexOf(field)], fieldType, fieldLen);
                                    }
                                    if ((field == null) && !(IsSystemSqlParameter(query, paramName)))
                                    	foreach (ParameterValue pv in parameters)
                                        	if (pv.Name.Equals(paramName))
                                            {
                                                query.AddParameter(pv.Name, pv.Value).Direction = ParameterDirection.InputOutput;
                                                break;
                                            }
                                }
                    }
                    m = m.NextMatch();
                }
                int rowsAffected = query.ExecuteNonQuery();
                foreach (DbParameter p in query.Parameters)
                {
                    string fieldName = p.ParameterName.Substring(1);
                    Match fm = SqlFieldFilterOperationRegex.Match(fieldName);
                    if (fm.Success)
                    {
                        string name = fm.Groups["Name"].Value;
                        string operation = fm.Groups["Operation"].Value;
                        object value = p.Value;
                        if (!(DBNull.Value.Equals(value)))
                        {
                            if (value.GetType() == typeof(System.DateTime))
                            	value = ((System.DateTime)(value)).AddMinutes(ControllerUtilities.UtcOffsetInMinutes);
                            FilterValue filter = SelectFilterValue(name);
                            if ("null".Equals(Convert.ToString(value), StringComparison.OrdinalIgnoreCase))
                            	value = null;
                            if (filter != null)
                            	filter.AddValue(value);
                            else
                            	filter = new FilterValue(name, ((RowFilterOperation)(TypeDescriptor.GetConverter(typeof(RowFilterOperation)).ConvertFromString(operation))), value);
                            ChangeFilter(filter);
                        }
                    }
                    else
                    {
                        FieldValue fv = SelectFieldValueObject(fieldName);
                        if ((fv != null) && (Convert.ToString(fv.Value) != Convert.ToString(p.Value)))
                        	UpdateFieldValue(fv.Name, p.Value);
                        DataField field = null;
                        if (buildingRow)
                        {
                            field = Page.FindField(fieldName);
                            if (field != null)
                            {
                                object v = p.Value;
                                if (DBNull.Value.Equals(v))
                                	v = null;
                                _row[Page.Fields.IndexOf(field)] = v;
                            }
                        }
                        if ((field == null) && !(ProcessSystemSqlParameter(query, p.ParameterName)))
                        	foreach (ParameterValue pv in parameters)
                            	if (pv.Name.Equals(p.ParameterName, StringComparison.InvariantCultureIgnoreCase))
                                	pv.Value = p.Value;
                    }
                }
                return rowsAffected;
            }
        }
        
        /// <summary>
        /// Returns the maximum length of SQL Parameter
        /// </summary>
        /// <param name="parameterName">The name of SQL parameter without a leading "parameter marker" symbol.</param>
        /// <returns>The integer value representing the maximum size of SQL parameter.</returns>
        protected virtual int MaximumSizeOfSqlParameter(string parameterName)
        {
            if (parameterName.StartsWith("Result_"))
            	return 512;
            return 255;
        }
        
        private bool IsSystemSqlProperty(string propertyName)
        {
            return SystemSqlPropertyRegex.IsMatch(propertyName);
        }
        
        /// <summary>
        /// Gets a property of a business rule class instance, session variable, or URL parameter.
        /// </summary>
        /// <param name="propertyName">The name of a business rule property, session variable, or URL parameter.</param>
        /// <returns>The value of the property.</returns>
        public virtual object GetProperty(string propertyName)
        {
            if (propertyName.StartsWith("Parameters_"))
            	return SelectFieldValue(propertyName);
            if (propertyName.StartsWith("ContextFields_"))
            	return SelectExternalFilterFieldValue(propertyName.Substring(14));
            if (propertyName.StartsWith("Url_"))
            {
                propertyName = propertyName.Substring(4);
                if (Context.Request.UrlReferrer != null)
                {
                    Match m = Regex.Match(Context.Request.UrlReferrer.PathAndQuery, String.Format("(\\?|&){0}=(?\'Value\'.*?)(&|$)", propertyName));
                    if (m.Success)
                    	return m.Groups["Value"].Value;
                }
                return null;
            }
            else
            	if (propertyName.StartsWith("Session_"))
                {
                    propertyName = propertyName.Substring(8);
                    return Context.Session[propertyName];
                }
                else
                {
                    Type t = GetType();
                    object target = this;
                    if (propertyName.StartsWith("BusinessRules_"))
                    	propertyName = propertyName.Substring(14);
                    else
                    	if (propertyName.StartsWith("Arguments_"))
                        {
                            propertyName = propertyName.Substring(10);
                            t = typeof(ActionArgs);
                            target = this.Arguments;
                            if (target == null)
                            	return null;
                        }
                    return t.InvokeMember(propertyName, (((BindingFlags.GetProperty | BindingFlags.GetField) | BindingFlags.Public) | ((BindingFlags.Instance | BindingFlags.Static) | BindingFlags.FlattenHierarchy)), null, target, new object[0]);
                }
        }
        
        /// <summary>
        /// Sets the property of the business rule class instance or the session variable value.
        /// </summary>
        /// <param name="propertyName">The name of the property or session variable.</param>
        /// <param name="value">The value of the property.</param>
        public virtual void SetProperty(string propertyName, object value)
        {
            if (propertyName.StartsWith("Url_"))
            {
                // URL properties are read-only.
                return;
            }
            else
            	if (propertyName.StartsWith("Session_") || propertyName.StartsWith("Arguments_"))
                {
                    propertyName = propertyName.Substring(8);
                    if (value is string)
                    {
                        string s = ((string)(value));
                        Guid tempGuid;
                        if (Guid.TryParse(s, out tempGuid))
                        	value = tempGuid;
                        else
                        {
                            int tempInt;
                            if (int.TryParse(s, out tempInt))
                            	value = tempInt;
                            else
                            {
                                double tempDouble;
                                if (double.TryParse(s, out tempDouble))
                                	value = tempDouble;
                                else
                                {
                                    System.DateTime tempDateTime;
                                    if (DateTime.TryParse(s, out tempDateTime))
                                    	value = tempDateTime;
                                }
                            }
                        }
                    }
                    Context.Session[propertyName] = value;
                }
                else
                {
                    if (propertyName.StartsWith("BusinessRules_"))
                    	propertyName = propertyName.Substring(14);
                    GetType().InvokeMember(propertyName, (((BindingFlags.SetProperty | BindingFlags.SetField) | BindingFlags.Public) | ((BindingFlags.Instance | BindingFlags.Static) | BindingFlags.FlattenHierarchy)), null, this, new object[] {
                                value});
                }
        }
        
        protected virtual bool IsSystemSqlParameter(SqlText sql, string parameterName)
        {
            string nameWithoutMarker = parameterName.Substring(1);
            bool isProperty = IsSystemSqlProperty(nameWithoutMarker);
            int systemParameterIndex = Array.IndexOf(SystemSqlParameters, nameWithoutMarker);
            if ((systemParameterIndex == -1) && !(isProperty))
            	return false;
            if ((systemParameterIndex >= 0) && (systemParameterIndex <= 3))
            	sql.AddParameter(parameterName, 0).Direction = ParameterDirection.InputOutput;
            else
            {
                object value = String.Empty;
                if (isProperty)
                	value = GetProperty(nameWithoutMarker);
                DbParameter p = sql.AddParameter(parameterName, value);
                if (IsSystemSqlProperty(nameWithoutMarker) && (value == null))
                	value = String.Empty;
                if ((value != null) && !(DBNull.Value.Equals(value)))
                {
                    p.Direction = ParameterDirection.InputOutput;
                    if ((value is string) && (((string)(value)).Length < MaximumSizeOfSqlParameter(nameWithoutMarker)))
                    	p.Size = MaximumSizeOfSqlParameter(nameWithoutMarker);
                }
            }
            return true;
        }
        
        protected virtual bool ProcessSystemSqlParameter(SqlText sql, string parameterName)
        {
            string nameWithoutMarker = parameterName.Substring(1);
            bool isProperty = IsSystemSqlProperty(nameWithoutMarker);
            if ((Array.IndexOf(SystemSqlParameters, nameWithoutMarker) == -1) && !(isProperty))
            	return false;
            DbParameter p = sql.Parameters[parameterName];
            if (nameWithoutMarker == "BusinessRules_PreventDefault")
            {
                // prevent standard processing
                if (!(0.Equals(p.Value)))
                	PreventDefault();
            }
            else
            	if (nameWithoutMarker == "Result_Continue")
                {
                    // continue standard processing on the client
                    if (!(0.Equals(p.Value)))
                    	Result.Continue();
                }
                else
                	if (isProperty)
                    {
                        object currentValue = GetProperty(nameWithoutMarker);
                        if (!((Convert.ToString(currentValue) == Convert.ToString(p.Value))))
                        	SetProperty(nameWithoutMarker, p.Value);
                    }
                    else
                    {
                        string s = Convert.ToString(p.Value);
                        if (!(String.IsNullOrEmpty(s)))
                        {
                            if (nameWithoutMarker == "Result_Focus")
                            {
                                Match m = Regex.Match(s, "^\\s*(?\'FieldName\'\\w+)\\s*(,\\s*(?\'Message\'.+))?$");
                                Result.Focus(m.Groups["FieldName"].Value, m.Groups["Message"].Value);
                            }
                            if (nameWithoutMarker == "Result_ShowViewMessage")
                            	Result.ShowViewMessage(s);
                            if (nameWithoutMarker == "Result_ShowMessage")
                            	Result.ShowMessage(s);
                            if (nameWithoutMarker == "Result_ShowAlert")
                            	Result.ShowAlert(s);
                            if (nameWithoutMarker == "Result_Error")
                            	throw new Exception(s);
                            if (nameWithoutMarker == "Result_ExecuteOnClient")
                            	Result.ExecuteOnClient(s);
                            if (nameWithoutMarker == "Result_NavigateUrl")
                            {
                                Result.NavigateUrl = s;
                                Result.Continue();
                            }
                            if (nameWithoutMarker == "Result_Refresh")
                            	Result.Refresh();
                            if (nameWithoutMarker == "Result_RefreshChildren")
                            	Result.RefreshChildren();
                        }
                    }
            return true;
        }
        
        protected override void ExecuteMethod(ActionArgs args, ActionResult result, ActionPhase phase)
        {
            ExecuteServerRules(args, result, phase);
            base.ExecuteMethod(args, result, phase);
        }
        
        public void ExecuteServerRules(ActionArgs args, ActionResult result, ActionPhase phase)
        {
            if (Result.Canceled || args.IgnoreBusinessRules)
            	return;
            this.Arguments = args;
            this.Result = result;
            ExecuteServerRules(phase, args.View, args.CommandName, args.CommandArgument);
            if ((phase == ActionPhase.Before) && !(Result.Canceled))
            	ExecuteServerRules(ActionPhase.Execute, args.View, args.CommandName, args.CommandArgument);
        }
        
        public void ExecuteServerRules(PageRequest request, ActionPhase phase)
        {
            ExecuteServerRules(request, phase, "Select", null);
        }
        
        public void ExecuteServerRules(PageRequest request, ActionPhase phase, string commandName, object[] row)
        {
            _request = request;
            _requestFilter = request.Filter;
            _requestExternalFilter = request.ExternalFilter;
            _row = row;
            if ((phase == ActionPhase.Execute) && (commandName == "Select"))
            	BlobAdapterFactory.InitializeRow(this.Page, row);
            ExecuteServerRules(phase, request.View, commandName, String.Empty);
        }
        
        public void ExecuteServerRules(DistinctValueRequest request, ActionPhase phase)
        {
            _requestFilter = request.Filter;
            _requestExternalFilter = request.ExternalFilter;
            ExecuteServerRules(phase, request.View, "Select", String.Empty);
        }
        
        protected void ExecuteServerRules(ActionPhase phase, string view, string commandName, string commandArgument)
        {
            InternalExecuteServerRules(phase, view, commandName, commandArgument);
        }
        
        public bool SupportsCommand(string type, string commandName)
        {
            string[] types = type.Split(new char[] {
                        '|'}, StringSplitOptions.RemoveEmptyEntries);
            string[] commandNames = commandName.Split(new char[] {
                        '|'}, StringSplitOptions.RemoveEmptyEntries);
            foreach (string t in types)
            	foreach (string c in commandNames)
                {
                    XPathNodeIterator ruleIterator = Config.Select("/c:dataController/c:businessRules/c:rule[@type=\'{0}\']", t);
                    while (ruleIterator.MoveNext())
                    {
                        string ruleCommandName = ruleIterator.Current.GetAttribute("commandName", String.Empty);
                        if ((ruleCommandName == c) || Regex.IsMatch(c, ruleCommandName))
                        	return true;
                    }
                }
            if (commandName == "Select")
            	return (Config.SelectSingleNode("/c:dataController/c:fields/c:field[@onDemandHandler!=\'\']") != null);
            return false;
        }
        
        protected virtual void InternalExecuteServerRules(ActionPhase phase, string view, string commandName, string commandArgument)
        {
            XPathNodeIterator iterator = Config.Select("/c:dataController/c:businessRules/c:rule[@phase=\'{0}\']", phase);
            while (iterator.MoveNext())
            {
                string ruleType = iterator.Current.GetAttribute("type", String.Empty);
                string ruleView = iterator.Current.GetAttribute("view", String.Empty);
                string ruleCommandName = iterator.Current.GetAttribute("commandName", String.Empty);
                string ruleCommandArgument = iterator.Current.GetAttribute("commandArgument", String.Empty);
                string ruleName = iterator.Current.GetAttribute("name", String.Empty);
                if (String.IsNullOrEmpty(ruleName))
                	ruleName = iterator.Current.GetAttribute("id", String.Empty);
                bool skip = false;
                if (!((String.IsNullOrEmpty(ruleView) || ((ruleView == view) || Regex.IsMatch(view, ruleView)))))
                	skip = true;
                if (!((String.IsNullOrEmpty(ruleCommandName) || ((ruleCommandName == commandName) || Regex.IsMatch(commandName, ruleCommandName)))))
                	skip = true;
                if (!((String.IsNullOrEmpty(ruleCommandArgument) || ((ruleCommandArgument == commandArgument) || (!(String.IsNullOrEmpty(commandArgument)) && Regex.IsMatch(commandArgument, ruleCommandArgument))))))
                	skip = true;
                if (!(skip) && !(String.IsNullOrEmpty(ruleName)))
                {
                    if (!(String.IsNullOrEmpty(Whitelist)) && (Array.IndexOf(Whitelist.Split(new char[] {
                                                ';',
                                                ','}, StringSplitOptions.RemoveEmptyEntries), ruleName) == -1))
                    	skip = true;
                    if (!(String.IsNullOrEmpty(Blacklist)) && !((Array.IndexOf(Blacklist.Split(new char[] {
                                                ';',
                                                ','}, StringSplitOptions.RemoveEmptyEntries), ruleName) == -1)))
                    	skip = true;
                }
                if (!(skip))
                {
                    if (ruleType == "Sql")
                    	Sql(iterator.Current.Value);
                    if (ruleType == "Code")
                    	ExecuteRule(iterator.Current);
                    BlockRule(ruleName);
                    if (Result.Canceled)
                    	break;
                }
            }
        }
        
        private string ReplaceFieldNamesWithValues(string text)
        {
            return Regex.Replace(text, "\\{(?\'ParameterMarker\':|@)?(?\'Name\'\\w+)(\\s*,\\s*(?\'Format\'.+?)\\s*)?\\}", DoReplaceFieldNameInText);
        }
        
        private string DoReplaceFieldNameInText(Match m)
        {
            object v = null;
            string name = m.Groups["Name"].Value;
            if (!(String.IsNullOrEmpty(m.Groups["ParameterMarker"].Value)))
            	v = GetProperty(name);
            else
            {
                Match m2 = Regex.Match(name, "^(?\'Name\'\\w+?)(_(?\'ValueType\'NewValue|OldValue|Value|Modified))?$");
                name = m2.Groups["Name"].Value;
                string valueType = m2.Groups["ValueType"].Value;
                FieldValue fv = SelectFieldValueObject(name);
                if (fv == null)
                	return m.Value;
                v = fv.Value;
                if (valueType == "NewValue")
                	v = fv.NewValue;
                else
                	if (valueType == "OldValue")
                    	v = fv.OldValue;
                    else
                    	if (valueType == "Modified")
                        	v = fv.Modified;
            }
            string format = m.Groups["Format"].Value;
            if (!(String.IsNullOrEmpty(format)))
            {
                if (!(format.Contains("}")))
                	format = String.Format("{{0:{0}}}", format.Trim());
                return String.Format(format, v);
            }
            return Convert.ToString(v);
        }
        
        private string DoReplaceActionParameter(Match m)
        {
            string name = m.Groups["Name"].Value.ToLower();
            string value = ReplaceFieldNamesWithValues(m.Groups["Value"].Value);
            if (!(_actionParameters.ContainsKey(name)))
            	_actionParameters.Add(name, value);
            return String.Empty;
        }
        
        protected void AssignActionParameters(string data)
        {
            _actionParameters = null;
            _actionParametersData = data;
        }
        
        public string GetActionParameterByName(string name)
        {
            return GetActionParameterByName(name, null);
        }
        
        public string GetActionParameterByName(string name, object defaultValue)
        {
            string v = null;
            if (!(ActionParameters.TryGetValue(name.ToLower(), out v)))
            	return Convert.ToString(defaultValue);
            return v;
        }
        
        public static string JavaScriptString(object value)
        {
            return JavaScriptString(value, false);
        }
        
        public static string JavaScriptString(object value, bool addSingleQuotes)
        {
            string s = System.Web.HttpUtility.JavaScriptStringEncode(Convert.ToString(value));
            if (addSingleQuotes)
            	s = String.Format("\'{0}\'\'", s);
            return s;
        }
    }
}

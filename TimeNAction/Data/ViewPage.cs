using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Data.Common;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml;
using System.Xml.XPath;
using System.Web;
using System.Web.Caching;
using System.Web.Configuration;
using System.Web.Security;

namespace TimeNAction.Data
{
	public class ViewPage
    {
        
        private int _skipCount;
        
        private int _readCount;
        
        private string[] _originalFilter;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string _tag;
        
        private bool _requiresMetaData;
        
        private bool _requiresRowCount;
        
        private object[] _aggregates;
        
        private object[] _newRow;
        
        private List<DataField> _fields;
        
        private string _sortExpression;
        
        private int _totalRowCount;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private int _pageIndex;
        
        private int _pageSize;
        
        private int _pageOffset;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string _clientScript;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string _firstLetters;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string[] _filter;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string[] _systemFilter;
        
        private List<object[]> _rows;
        
        private string _distinctValueFieldName;
        
        private List<View> _views;
        
        private List<ActionGroup> _actionGroups;
        
        private List<Category> _categories;
        
        private DynamicExpression[] _expressions;
        
        private string _controller;
        
        private string _view;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private bool _supportsCaching;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string _viewType;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string _lastView;
        
        private bool _inTransaction;
        
        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string _statusBar;
        
        private bool _allowDistinctFieldInFilter;
        
        private string[] _icons;
        
        private FieldValue[] _levs;
        
        [ThreadStatic]
        public static bool PopulatingStaticItems;
        
        private SortedDictionary<string, object> _customFilter;
        
        public ViewPage() : 
                this(new PageRequest(0, 0, null, null))
        {
        }
        
        public ViewPage(DistinctValueRequest request) : 
                this(new PageRequest(0, 0, null, request.Filter))
        {
            _tag = request.Tag;
            _distinctValueFieldName = request.FieldName;
            _pageSize = request.MaximumValueCount;
            _allowDistinctFieldInFilter = request.AllowFieldInFilter;
            _controller = request.Controller;
            _view = request.View;
        }
        
        public ViewPage(PageRequest request)
        {
            _tag = request.Tag;
            this.PageOffset = request.PageOffset;
            _requiresMetaData = ((request.PageIndex == -1) || request.RequiresMetaData);
            _requiresRowCount = ((request.PageIndex < 0) || request.RequiresRowCount);
            if (request.PageIndex == -2)
            	request.PageIndex = 0;
            _pageSize = request.PageSize;
            if (request.PageIndex > 0)
            	_pageIndex = request.PageIndex;
            _rows = new List<object[]>();
            _fields = new List<DataField>();
            _skipCount = (_pageIndex * request.PageSize);
            _readCount = request.PageSize;
            _sortExpression = request.SortExpression;
            _filter = request.Filter;
            _systemFilter = request.SystemFilter;
            _totalRowCount = -1;
            _views = new List<View>();
            _actionGroups = new List<ActionGroup>();
            _categories = new List<Category>();
            _controller = request.Controller;
            _view = request.View;
            _inTransaction = !(String.IsNullOrEmpty(request.Transaction));
            _lastView = request.LastView;
            _viewType = request.ViewType;
            _supportsCaching = request.SupportsCaching;
        }
        
        public string Tag
        {
            get
            {
                return this._tag;
            }
            set
            {
                this._tag = value;
            }
        }
        
        public bool RequiresMetaData
        {
            get
            {
                return _requiresMetaData;
            }
        }
        
        public bool RequiresRowCount
        {
            get
            {
                return _requiresRowCount;
            }
        }
        
        public bool RequiresAggregates
        {
            get
            {
                foreach (DataField field in Fields)
                	if (field.Aggregate != DataFieldAggregate.None)
                    	return true;
                return false;
            }
        }
        
        public object[] Aggregates
        {
            get
            {
                return _aggregates;
            }
            set
            {
                _aggregates = value;
            }
        }
        
        public object[] NewRow
        {
            get
            {
                return _newRow;
            }
            set
            {
                _newRow = value;
            }
        }
        
        public List<DataField> Fields
        {
            get
            {
                return _fields;
            }
        }
        
        public string SortExpression
        {
            get
            {
                return _sortExpression;
            }
            set
            {
                _sortExpression = value;
            }
        }
        
        public int TotalRowCount
        {
            get
            {
                return _totalRowCount;
            }
            set
            {
                _totalRowCount = value;
                int pageCount = (value / this.PageSize);
                if ((value % this.PageSize) > 0)
                	pageCount++;
                if (pageCount <= PageIndex)
                	this._pageIndex = 0;
            }
        }
        
        public int PageIndex
        {
            get
            {
                return this._pageIndex;
            }
            set
            {
                this._pageIndex = value;
            }
        }
        
        public int PageSize
        {
            get
            {
                return _pageSize;
            }
        }
        
        public int PageOffset
        {
            get
            {
                return _pageOffset;
            }
            set
            {
                _pageOffset = value;
            }
        }
        
        public string ClientScript
        {
            get
            {
                return this._clientScript;
            }
            set
            {
                this._clientScript = value;
            }
        }
        
        public string FirstLetters
        {
            get
            {
                return this._firstLetters;
            }
            set
            {
                this._firstLetters = value;
            }
        }
        
        public string[] Filter
        {
            get
            {
                return this._filter;
            }
            set
            {
                this._filter = value;
            }
        }
        
        public string[] SystemFilter
        {
            get
            {
                return this._systemFilter;
            }
            set
            {
                this._systemFilter = value;
            }
        }
        
        public List<object[]> Rows
        {
            get
            {
                return _rows;
            }
        }
        
        public string DistinctValueFieldName
        {
            get
            {
                return _distinctValueFieldName;
            }
        }
        
        public List<View> Views
        {
            get
            {
                return _views;
            }
        }
        
        public List<ActionGroup> ActionGroups
        {
            get
            {
                return _actionGroups;
            }
        }
        
        public List<Category> Categories
        {
            get
            {
                return _categories;
            }
        }
        
        public DynamicExpression[] Expressions
        {
            get
            {
                return _expressions;
            }
            set
            {
                _expressions = value;
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
        
        public bool SupportsCaching
        {
            get
            {
                return this._supportsCaching;
            }
            set
            {
                this._supportsCaching = value;
            }
        }
        
        public string ViewType
        {
            get
            {
                return this._viewType;
            }
            set
            {
                this._viewType = value;
            }
        }
        
        public string LastView
        {
            get
            {
                return this._lastView;
            }
            set
            {
                this._lastView = value;
            }
        }
        
        public bool InTransaction
        {
            get
            {
                return _inTransaction;
            }
        }
        
        public string StatusBar
        {
            get
            {
                return this._statusBar;
            }
            set
            {
                this._statusBar = value;
            }
        }
        
        public bool AllowDistinctFieldInFilter
        {
            get
            {
                return _allowDistinctFieldInFilter;
            }
        }
        
        public string[] Icons
        {
            get
            {
                return _icons;
            }
            set
            {
                _icons = value;
            }
        }
        
        public bool IsAuthenticated
        {
            get
            {
                return HttpContext.Current.User.Identity.IsAuthenticated;
            }
        }
        
        public FieldValue[] LEVs
        {
            get
            {
                return _levs;
            }
            set
            {
                _levs = value;
            }
        }
        
        public void ChangeFilter(string[] filter)
        {
            _filter = filter;
            _originalFilter = null;
        }
        
        public bool SkipNext()
        {
            if (_skipCount == 0)
            	return false;
            _skipCount--;
            return true;
        }
        
        public bool ReadNext()
        {
            if (_readCount == 0)
            	return false;
            _readCount--;
            return true;
        }
        
        public void AcceptAllRows()
        {
            _readCount = Int32.MaxValue;
            _skipCount = 0;
        }
        
        public bool ContainsField(string name)
        {
            return (FindField(name) != null);
        }
        
        public DataField FindField(string name)
        {
            foreach (DataField field in Fields)
            	if (field.Name.Equals(name, StringComparison.InvariantCultureIgnoreCase))
                	return field;
            return null;
        }
        
        public bool PopulateStaticItems(DataField field, FieldValue[] contextValues)
        {
            if (field.SupportsStaticItems() && (String.IsNullOrEmpty(field.ContextFields) || ((contextValues != null) || (field.ItemsStyle == "CheckBoxList"))))
            {
                if (PopulatingStaticItems)
                	return true;
                PopulatingStaticItems = true;
                try
                {
                    string[] filter = null;
                    if (!(String.IsNullOrEmpty(field.ContextFields)))
                    {
                        List<string> contextFilter = new List<string>();
                        Match m = Regex.Match(field.ContextFields, "(\\w+)=(.+?)($|,)");
                        while (m.Success)
                        {
                            Match vm = Regex.Match(m.Groups[2].Value, "^\'(.+?)\'$");
                            if (vm.Success)
                            	contextFilter.Add(String.Format("{0}:={1}", m.Groups[1].Value, vm.Groups[1].Value));
                            else
                            	if (contextValues != null)
                                	foreach (FieldValue cv in contextValues)
                                    	if (cv.Name == m.Groups[2].Value)
                                        {
                                            contextFilter.Add(String.Format("{0}:={1}", m.Groups[1].Value, cv.NewValue));
                                            break;
                                        }
                            m = m.NextMatch();
                        }
                        filter = contextFilter.ToArray();
                    }
                    PageRequest request = new PageRequest(-1, 1000, field.ItemsDataTextField, filter);
                    if (ActionArgs.Current != null)
                    	request.ExternalFilter = ActionArgs.Current.ExternalFilter;
                    ViewPage page = ControllerFactory.CreateDataController().GetPage(field.ItemsDataController, field.ItemsDataView, request);
                    int dataValueFieldIndex = page.Fields.IndexOf(page.FindField(field.ItemsDataValueField));
                    if (dataValueFieldIndex == -1)
                    	foreach (DataField aField in page.Fields)
                        	if (aField.IsPrimaryKey)
                            {
                                dataValueFieldIndex = page.Fields.IndexOf(aField);
                                break;
                            }
                    int dataTextFieldIndex = page.Fields.IndexOf(page.FindField(field.ItemsDataTextField));
                    if (dataTextFieldIndex == -1)
                    {
                        int i = 0;
                        while ((dataTextFieldIndex == -1) && (i < page.Fields.Count))
                        {
                            DataField f = page.Fields[i];
                            if (!(f.Hidden) && (f.Type == "String"))
                            	dataTextFieldIndex = i;
                            i++;
                        }
                        if (dataTextFieldIndex == -1)
                        	dataTextFieldIndex = 0;
                    }
                    List<int> fieldIndexes = new List<int>();
                    fieldIndexes.Add(dataValueFieldIndex);
                    fieldIndexes.Add(dataTextFieldIndex);
                    if (!(String.IsNullOrEmpty(field.Copy)))
                    {
                        Match m = Regex.Match(field.Copy, "(\\w+)=(\\w+)");
                        while (m.Success)
                        {
                            int copyFieldIndex = page.Fields.IndexOf(page.FindField(m.Groups[2].Value));
                            if (copyFieldIndex >= 0)
                            	fieldIndexes.Add(copyFieldIndex);
                            m = m.NextMatch();
                        }
                    }
                    foreach (object[] row in page.Rows)
                    {
                        object[] values = new object[fieldIndexes.Count];
                        for (int i = 0; (i < fieldIndexes.Count); i++)
                        {
                            int copyFieldIndex = fieldIndexes[i];
                            if (copyFieldIndex >= 0)
                            	values[i] = row[copyFieldIndex];
                        }
                        field.Items.Add(values);
                    }
                    return true;
                }
                finally
                {
                    PopulatingStaticItems = false;
                }
            }
            return false;
        }
        
        public ViewPage ToResult(ControllerConfiguration configuration, XPathNavigator mainView)
        {
            if (!(_requiresMetaData))
            {
                Fields.Clear();
                Expressions = null;
            }
            else
            {
                XPathNodeIterator viewIterator = configuration.Select("/c:dataController/c:views/c:view[not(@virtualViewId!=\'\')]");
                while (viewIterator.MoveNext())
                	Views.Add(new View(viewIterator.Current, mainView, configuration.Resolver));
                XPathNodeIterator actionGroupIterator = configuration.Select("/c:dataController/c:actions//c:actionGroup");
                while (actionGroupIterator.MoveNext())
                	ActionGroups.Add(new ActionGroup(actionGroupIterator.Current, configuration.Resolver));
                foreach (DataField field in Fields)
                	PopulateStaticItems(field, null);
            }
            if (_originalFilter != null)
            	_filter = _originalFilter;
            if (new ControllerUtilities().SupportsLastEnteredValues(this.Controller))
            {
                if (RequiresMetaData && ((HttpContext.Current != null) && (HttpContext.Current.Session != null)))
                	LEVs = ((FieldValue[])(HttpContext.Current.Session[String.Format("{0}$LEVs", _controller)]));
            }
            return this;
        }
        
        public DataTable ToDataTable()
        {
            return ToDataTable("table");
        }
        
        public DataTable ToDataTable(string tableName)
        {
            DataTable table = new DataTable(tableName);
            List<Type> columnTypes = new List<Type>();
            foreach (DataField field in Fields)
            {
                System.Type t = typeof(string);
                if (!((field.Type == "Byte[]")))
                	t = DataControllerBase.TypeMap[field.Type];
                table.Columns.Add(field.Name, t);
                columnTypes.Add(t);
            }
            foreach (object[] row in Rows)
            {
                DataRow newRow = table.NewRow();
                for (int i = 0; (i < Fields.Count); i++)
                {
                    object v = row[i];
                    if (v == null)
                    	v = DBNull.Value;
                    else
                    {
                        Type t = columnTypes[i];
                        if ((t == typeof(DateTimeOffset)) && (v is string))
                        {
                            DateTimeOffset dto;
                            if (DateTimeOffset.TryParse(((string)(v)), out dto))
                            	v = dto;
                            else
                            	v = DBNull.Value;
                        }
                    }
                    newRow[i] = v;
                }
                table.Rows.Add(newRow);
            }
            table.AcceptChanges();
            return table;
        }
        
        public List<T> ToList<T>()
        
        {
            Type objectType = typeof(T);
            List<T> list = new List<T>();
            object[] args = new object[1];
            Type[] types = new Type[Fields.Count];
            for (int j = 0; (j < Fields.Count); j++)
            {
                System.Reflection.PropertyInfo propInfo = objectType.GetProperty(Fields[j].Name);
                if (propInfo != null)
                	types[j] = propInfo.PropertyType;
            }
            foreach (object[] row in Rows)
            {
                T instance = ((T)(objectType.Assembly.CreateInstance(objectType.FullName)));
                int i = 0;
                foreach (DataField field in Fields)
                {
                    try
                    {
                        Type fieldType = types[i];
                        if (fieldType != null)
                        {
                            args[0] = DataControllerBase.ConvertToType(fieldType, row[i]);
                            objectType.InvokeMember(field.Name, System.Reflection.BindingFlags.SetProperty, null, instance, args);
                        }
                    }
                    catch (Exception )
                    {
                    }
                    i++;
                }
                list.Add(instance);
            }
            return list;
        }
        
        public bool CustomFilteredBy(string fieldName)
        {
            return ((_customFilter != null) && _customFilter.ContainsKey(fieldName));
        }
        
        public void ApplyDataFilter(IDataFilter dataFilter, string controller, string view, string lookupContextController, string lookupContextView, string lookupContextFieldName)
        {
            if (dataFilter == null)
            	return;
            if (_filter == null)
            	_filter = new string[0];
            IDataFilter2 dataFilter2 = null;
            if (typeof(IDataFilter2).IsInstanceOfType(dataFilter))
            {
                dataFilter2 = ((IDataFilter2)(dataFilter));
                dataFilter2.AssignContext(controller, view, lookupContextController, lookupContextView, lookupContextFieldName);
            }
            List<string> newFilter = new List<string>(_filter);
            _customFilter = new SortedDictionary<string, object>();
            if (dataFilter2 != null)
            	dataFilter2.Filter(controller, view, _customFilter);
            else
            	dataFilter.Filter(_customFilter);
            foreach (string key in _customFilter.Keys)
            {
                object v = _customFilter[key];
                if ((v == null) || !(v.GetType().IsArray))
                	v = new object[] {
                            v};
                StringBuilder sb = new StringBuilder();
                sb.AppendFormat("{0}:", key);
                foreach (object item in ((Array)(v)))
                {
                    if (dataFilter2 != null)
                    	sb.Append(item);
                    else
                    	sb.AppendFormat("={0}", item);
                    sb.Append(Convert.ToChar(0));
                }
                newFilter.Add(sb.ToString());
            }
            _originalFilter = _filter;
            _filter = newFilter.ToArray();
        }
        
        public void UpdateFieldValue(string fieldName, object[] row, object value)
        {
            for (int i = 0; (i < Fields.Count); i++)
            	if (Fields[i].Name.Equals(fieldName, StringComparison.InvariantCultureIgnoreCase))
                	row[i] = value;
        }
        
        public object SelectFieldValue(string fieldName, object[] row)
        {
            for (int i = 0; (i < Fields.Count); i++)
            	if (Fields[i].Name.Equals(fieldName, StringComparison.InvariantCultureIgnoreCase))
                	return row[i];
            return null;
        }
        
        public FieldValue SelectFieldValueObject(string fieldName, object[] row)
        {
            for (int i = 0; (i < Fields.Count); i++)
            	if (Fields[i].Name.Equals(fieldName, StringComparison.InvariantCultureIgnoreCase))
                	return new FieldValue(fieldName, row[i]);
            return null;
        }
        
        public void RemoveFromFilter(string fieldName)
        {
            if (_filter == null)
            	return;
            List<string> newFilter = new List<string>(_filter);
            string prefix = (fieldName + ":");
            foreach (string s in newFilter)
            	if (s.StartsWith(prefix))
                {
                    newFilter.Remove(s);
                    break;
                }
            _filter = newFilter.ToArray();
        }
    }
}

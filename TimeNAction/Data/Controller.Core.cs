using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Configuration;
using System.Data;
using System.Data.Common;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Transactions;
using System.Xml;
using System.Xml.XPath;
using System.Xml.Xsl;
using System.Web;
using System.Web.Caching;
using System.Web.Configuration;
using System.Web.Security;
using TimeNAction.Services;

namespace TimeNAction.Data
{
	public partial class Controller : DataControllerBase
    {
    }
    
    public partial class DataControllerBase : IDataController, IAutoCompleteManager, IDataEngine, IBusinessObject
    {
        
        public const int MaximumDistinctValues = 200;
        
        public static Type[] SpecialConversionTypes = new Type[] {
                typeof(System.Guid),
                typeof(System.DateTimeOffset),
                typeof(System.TimeSpan)};
        
        public static SpecialConversionFunction[] SpecialConverters;
        
        public static string[] SpecialTypes = new string[] {
                "System.DateTimeOffset",
                "System.TimeSpan",
                "Microsoft.SqlServer.Types.SqlGeography",
                "Microsoft.SqlServer.Types.SqlHierarchyId"};
        
        private BusinessRules _serverRules;
        
        public static Stream DefaultDataControllerStream = new MemoryStream();
        
        static DataControllerBase()
        {
            // initialize type map
            _typeMap = new SortedDictionary<string, Type>();
            _typeMap.Add("AnsiString", typeof(string));
            _typeMap.Add("Binary", typeof(byte[]));
            _typeMap.Add("Byte", typeof(byte));
            _typeMap.Add("Boolean", typeof(bool));
            _typeMap.Add("Currency", typeof(decimal));
            _typeMap.Add("Date", typeof(DateTime));
            _typeMap.Add("DateTime", typeof(DateTime));
            _typeMap.Add("Decimal", typeof(decimal));
            _typeMap.Add("Double", typeof(double));
            _typeMap.Add("Guid", typeof(Guid));
            _typeMap.Add("Int16", typeof(short));
            _typeMap.Add("Int32", typeof(int));
            _typeMap.Add("Int64", typeof(long));
            _typeMap.Add("Object", typeof(object));
            _typeMap.Add("SByte", typeof(sbyte));
            _typeMap.Add("Single", typeof(float));
            _typeMap.Add("String", typeof(string));
            _typeMap.Add("Time", typeof(TimeSpan));
            _typeMap.Add("TimeSpan", typeof(DateTime));
            _typeMap.Add("UInt16", typeof(ushort));
            _typeMap.Add("UInt32", typeof(uint));
            _typeMap.Add("UInt64", typeof(ulong));
            _typeMap.Add("VarNumeric", typeof(object));
            _typeMap.Add("AnsiStringFixedLength", typeof(string));
            _typeMap.Add("StringFixedLength", typeof(string));
            _typeMap.Add("Xml", typeof(string));
            _typeMap.Add("DateTime2", typeof(DateTime));
            _typeMap.Add("DateTimeOffset", typeof(DateTimeOffset));
            // initialize rowset type map
            _rowsetTypeMap = new SortedDictionary<string, string>();
            _rowsetTypeMap.Add("AnsiString", "string");
            _rowsetTypeMap.Add("Binary", "bin.base64");
            _rowsetTypeMap.Add("Byte", "u1");
            _rowsetTypeMap.Add("Boolean", "boolean");
            _rowsetTypeMap.Add("Currency", "float");
            _rowsetTypeMap.Add("Date", "date");
            _rowsetTypeMap.Add("DateTime", "dateTime");
            _rowsetTypeMap.Add("Decimal", "float");
            _rowsetTypeMap.Add("Double", "float");
            _rowsetTypeMap.Add("Guid", "uuid");
            _rowsetTypeMap.Add("Int16", "i2");
            _rowsetTypeMap.Add("Int32", "i4");
            _rowsetTypeMap.Add("Int64", "i8");
            _rowsetTypeMap.Add("Object", "string");
            _rowsetTypeMap.Add("SByte", "i1");
            _rowsetTypeMap.Add("Single", "float");
            _rowsetTypeMap.Add("String", "string");
            _rowsetTypeMap.Add("Time", "time");
            _rowsetTypeMap.Add("UInt16", "u2");
            _rowsetTypeMap.Add("UInt32", "u4");
            _rowsetTypeMap.Add("UIn64", "u8");
            _rowsetTypeMap.Add("VarNumeric", "float");
            _rowsetTypeMap.Add("AnsiStringFixedLength", "string");
            _rowsetTypeMap.Add("StringFixedLength", "string");
            _rowsetTypeMap.Add("Xml", "string");
            _rowsetTypeMap.Add("DateTime2", "dateTime");
            _rowsetTypeMap.Add("DateTimeOffset", "dateTime.tz");
            _rowsetTypeMap.Add("TimeSpan", "time");
            // initialize the special converters
            SpecialConverters = new SpecialConversionFunction[SpecialConversionTypes.Length];
            SpecialConverters[0] = ConvertToGuid;
            SpecialConverters[1] = ConvertToDateTimeOffset;
            SpecialConverters[2] = ConvertToTimeSpan;
        }
        
        public DataControllerBase()
        {
            Initialize();
        }
        
        protected virtual string HierarchyOrganizationFieldName
        {
            get
            {
                return "HierarchyOrganization__";
            }
        }
        
        protected virtual void Initialize()
        {
            CultureManager.Initialize();
        }
        
        public static bool StringIsNull(string s)
        {
            return ((s == "null") || (s == "%js%null"));
        }
        
        public static object ConvertToGuid(object o)
        {
            return new Guid(Convert.ToString(o));
        }
        
        public static object ConvertToDateTimeOffset(object o)
        {
            return System.DateTimeOffset.Parse(Convert.ToString(o));
        }
        
        public static object ConvertToTimeSpan(object o)
        {
            return System.TimeSpan.Parse(Convert.ToString(o));
        }
        
        public static object ConvertToType(Type targetType, object o)
        {
            if (targetType.IsGenericType)
            	targetType = targetType.GetProperty("Value").PropertyType;
            if ((o == null) || o.GetType().Equals(targetType))
            	return o;
            for (int i = 0; (i < SpecialConversionTypes.Length); i++)
            {
                Type t = SpecialConversionTypes[i];
                if (t == targetType)
                	return SpecialConverters[i](o);
            }
            if (o is IConvertible)
            	o = Convert.ChangeType(o, targetType);
            else
            	if (targetType.Equals(typeof(string)) && (o != null))
                	o = o.ToString();
            return o;
        }
        
        public static string ValueToString(object o)
        {
            System.Web.Script.Serialization.JavaScriptSerializer serializer = new System.Web.Script.Serialization.JavaScriptSerializer();
#pragma warning restore 0618
            return ("%js%" + serializer.Serialize(o));
        }
        
        public static object StringToValue(string s)
        {
            return StringToValue(null, s);
        }
        
        public static object StringToValue(DataField field, string s)
        {
            if (!(String.IsNullOrEmpty(s)) && s.StartsWith("%js%"))
            {
#pragma warning disable 0618
                System.Web.Script.Serialization.JavaScriptSerializer serializer = new System.Web.Script.Serialization.JavaScriptSerializer();
#pragma warning restore 0618
                object v = serializer.Deserialize<object>(s.Substring(4));
                if (!((v is string)) || ((field == null) || (field.Type == "String")))
                	return v;
                s = ((string)(v));
            }
            if (field != null)
            	return TypeDescriptor.GetConverter(Controller.TypeMap[field.Type]).ConvertFromString(s);
            return s;
        }
        
        public static object ConvertObjectToValue(object o)
        {
            if (SpecialTypes.Contains(o.GetType().FullName))
            	return o.ToString();
            return o;
        }
        
        protected BusinessRules CreateBusinessRules()
        {
            return BusinessRules.Create(_config);
        }
        
        ViewPage IDataController.GetPage(string controller, string view, PageRequest request)
        {
            SelectView(controller, view);
            request.AssignContext(controller, this._viewId);
            ViewPage page = new ViewPage(request);
            if (_config.PlugIn != null)
            	_config.PlugIn.PreProcessPageRequest(request, page);
            _config.AssignDynamicExpressions(page);
            page.ApplyDataFilter(_config.CreateDataFilter(), request.Controller, request.View, request.LookupContextController, request.LookupContextView, request.LookupContextFieldName);
            BusinessRules rules = _config.CreateBusinessRules();
            _serverRules = rules;
            if (_serverRules == null)
            	_serverRules = CreateBusinessRules();
            _serverRules.Page = page;
            _serverRules.RequiresRowCount = (page.RequiresRowCount && !((request.Inserting || request.DoesNotRequireData)));
            if (rules != null)
            	rules.BeforeSelect(request);
            else
            	_serverRules.ExecuteServerRules(request, ActionPhase.Before);
            using (DbConnection connection = CreateConnection())
            {
                if (_serverRules.RequiresRowCount)
                {
                    DbCommand countCommand = CreateCommand(connection);
                    ConfigureCommand(countCommand, page, CommandConfigurationType.SelectCount, null);
                    if (YieldsSingleRow(countCommand))
                    	page.TotalRowCount = 1;
                    else
                    	page.TotalRowCount = Convert.ToInt32(countCommand.ExecuteScalar());
                    if (page.RequiresAggregates)
                    {
                        DbCommand aggregateCommand = CreateCommand(connection);
                        ConfigureCommand(aggregateCommand, page, CommandConfigurationType.SelectAggregates, null);
                        DbDataReader reader = aggregateCommand.ExecuteReader();
                        if (reader.Read())
                        {
                            object[] aggregates = new object[page.Fields.Count];
                            for (int i = 0; (i < aggregates.Length); i++)
                            {
                                DataField field = page.Fields[i];
                                if (field.Aggregate != DataFieldAggregate.None)
                                {
                                    object v = reader[field.Name];
                                    if (!(DBNull.Value.Equals(v)))
                                    {
                                        if (!(field.FormatOnClient) && !(String.IsNullOrEmpty(field.DataFormatString)))
                                        	v = String.Format(field.DataFormatString, v);
                                        aggregates[i] = v;
                                    }
                                }
                            }
                            page.Aggregates = aggregates;
                        }
                        reader.Close();
                    }
                }
                if (page.RequiresMetaData)
                	PopulatePageCategories(page);
                SyncRequestedPage(request, page, connection);
                DbCommand selectCommand = CreateCommand(connection);
                ConfigureCommand(selectCommand, page, CommandConfigurationType.Select, null);
                if ((page.PageSize > 0) && !((request.Inserting || request.DoesNotRequireData)))
                {
                    EnsureSystemPageFields(request, page, selectCommand);
                    DbDataReader reader = null;
                    if (selectCommand == null)
                    	reader = ExecuteVirtualReader(request, page);
                    else
                    	reader = TransactionManager.ExecuteReader(request, page, selectCommand);
                    while (page.SkipNext())
                    	reader.Read();
                    while (page.ReadNext() && reader.Read())
                    {
                        object[] values = new object[page.Fields.Count];
                        for (int i = 0; (i < values.Length); i++)
                        {
                            DataField field = page.Fields[i];
                            object v = reader[field.Name];
                            if (!(DBNull.Value.Equals(v)))
                            {
                                if (field.IsMirror)
                                	v = String.Format(field.DataFormatString, v);
                                else
                                	if ((field.Type == "Guid") && (v.GetType() == typeof(byte[])))
                                    	v = new Guid(((byte[])(v)));
                                    else
                                    	v = ConvertObjectToValue(v);
                                values[i] = v;
                            }
                            if (!(String.IsNullOrEmpty(field.SourceFields)))
                            	values[i] = CreateValueFromSourceFields(field, reader);
                        }
                        page.Rows.Add(values);
                    }
                    reader.Close();
                }
            }
            if (_config.PlugIn != null)
            	_config.PlugIn.ProcessPageRequest(request, page);
            if (request.Inserting)
            	page.NewRow = new object[page.Fields.Count];
            if (request.Inserting)
            {
                if (_serverRules.SupportsCommand("Sql|Code", "New"))
                	_serverRules.ExecuteServerRules(request, ActionPhase.Execute, "New", page.NewRow);
            }
            else
            	if (_serverRules.SupportsCommand("Sql|Code", "Select"))
                	foreach (object[] row in page.Rows)
                    	_serverRules.ExecuteServerRules(request, ActionPhase.Execute, "Select", row);
            if (rules != null)
            {
                IRowHandler rowHandler = rules;
                if (request.Inserting)
                {
                    if (rowHandler.SupportsNewRow(request))
                    	rowHandler.NewRow(request, page, page.NewRow);
                }
                else
                	if (rowHandler.SupportsPrepareRow(request))
                    	foreach (object[] row in page.Rows)
                        	rowHandler.PrepareRow(request, page, row);
                if (rules != null)
                	rules.ProcessPageRequest(request, page);
            }
            page = page.ToResult(_config, _view);
            if (rules != null)
            	rules.AfterSelect(request);
            else
            	_serverRules.ExecuteServerRules(request, ActionPhase.After);
            _serverRules.Result.Merge(page);
            return page;
        }
        
        object[] IDataController.GetListOfValues(string controller, string view, DistinctValueRequest request)
        {
            SelectView(controller, view);
            ViewPage page = new ViewPage(request);
            page.ApplyDataFilter(_config.CreateDataFilter(), controller, view, request.LookupContextController, request.LookupContextView, request.LookupContextFieldName);
            List<object> distinctValues = new List<object>();
            BusinessRules rules = _config.CreateBusinessRules();
            _serverRules = rules;
            if (_serverRules == null)
            	_serverRules = CreateBusinessRules();
            _serverRules.Page = page;
            if (rules != null)
            	rules.BeforeSelect(request);
            else
            	_serverRules.ExecuteServerRules(request, ActionPhase.Before);
            using (DbConnection connection = CreateConnection())
            {
                DbCommand command = CreateCommand(connection);
                ConfigureCommand(command, page, CommandConfigurationType.SelectDistinct, null);
                DbDataReader reader = command.ExecuteReader();
                while (reader.Read() && (distinctValues.Count < page.PageSize))
                {
                    object v = reader.GetValue(0);
                    if (!(DBNull.Value.Equals(v)))
                    	v = ConvertObjectToValue(v);
                    distinctValues.Add(v);
                }
                reader.Close();
            }
            if (rules != null)
            	rules.AfterSelect(request);
            else
            	_serverRules.ExecuteServerRules(request, ActionPhase.After);
            return distinctValues.ToArray();
        }
        
        ActionResult IDataController.Execute(string controller, string view, ActionArgs args)
        {
            ActionResult result = new ActionResult();
            SelectView(controller, view);
            try
            {
                IActionHandler handler = _config.CreateActionHandler();
                if (_config.PlugIn != null)
                	_config.PlugIn.PreProcessArguments(args, result, CreateViewPage());
                if (args.SqlCommandType != CommandConfigurationType.None)
                	using (DbConnection connection = CreateConnection())
                    {
                        ExecutePreActionCommands(args, result, connection);
                        if (handler != null)
                        	handler.BeforeSqlAction(args, result);
                        else
                        	CreateBusinessRules().ExecuteServerRules(args, result, ActionPhase.Before);
                        if ((result.Errors.Count == 0) && !(result.Canceled))
                        {
                            DbCommand command = CreateCommand(connection, args);
                            if ((args.SelectedValues != null) && (((args.LastCommandName == "BatchEdit") && (args.CommandName == "Update")) || ((args.CommandName == "Delete") && (args.SelectedValues.Length > 1))))
                            {
                                ViewPage page = CreateViewPage();
                                PopulatePageFields(page);
                                string originalCommandText = command.CommandText;
                                foreach (string sv in args.SelectedValues)
                                {
                                    string[] key = sv.Split(',');
                                    int keyIndex = 0;
                                    foreach (FieldValue v in args.Values)
                                    {
                                        DataField field = page.FindField(v.Name);
                                        if (field != null)
                                        	if (!(field.IsPrimaryKey))
                                            	v.Modified = true;
                                            else
                                            	if (v.Name == field.Name)
                                                {
                                                    v.OldValue = key[keyIndex];
                                                    v.Modified = false;
                                                    keyIndex++;
                                                }
                                    }
                                    ConfigureCommand(command, null, args.SqlCommandType, args.Values);
                                    result.RowsAffected = (result.RowsAffected + TransactionManager.ExecuteNonQuery(command));
                                    if (handler != null)
                                    	handler.AfterSqlAction(args, result);
                                    else
                                    	CreateBusinessRules().ExecuteServerRules(args, result, ActionPhase.After);
                                    command.CommandText = originalCommandText;
                                    command.Parameters.Clear();
                                    if (_config.PlugIn != null)
                                    	_config.PlugIn.ProcessArguments(args, result, page);
                                    result.Canceled = false;
                                }
                            }
                            else
                            {
                                if (ConfigureCommand(command, null, args.SqlCommandType, args.Values))
                                {
                                    result.RowsAffected = TransactionManager.ExecuteNonQuery(args, result, CreateViewPage(), command);
                                    if (result.RowsAffected == 0)
                                    {
                                        result.RowNotFound = true;
                                        result.Errors.Add(Localizer.Replace("RecordChangedByAnotherUser", "The record has been changed by another user."));
                                    }
                                    else
                                    	ExecutePostActionCommands(args, result, connection);
                                }
                                if (handler != null)
                                	handler.AfterSqlAction(args, result);
                                else
                                	CreateBusinessRules().ExecuteServerRules(args, result, ActionPhase.After);
                                if (_config.PlugIn != null)
                                	_config.PlugIn.ProcessArguments(args, result, CreateViewPage());
                            }
                        }
                    }
                else
                	if (args.CommandName.StartsWith("Export"))
                    	ExecuteDataExport(args, result);
                    else
                    	if (args.CommandName.Equals("PopulateDynamicLookups"))
                        	PopulateDynamicLookups(args, result);
                        else
                        	if (args.CommandName.Equals("ProcessImportFile"))
                            	ImportProcessor.Execute(args);
                            else
                            	if (args.CommandName.Equals("Execute"))
                                	using (DbConnection connection = CreateConnection())
                                    {
                                        DbCommand command = CreateCommand(connection, args);
                                        TransactionManager.ExecuteNonQuery(command);
                                    }
                                else
                                	if (handler != null)
                                    {
                                        handler.ExecuteAction(args, result);
                                        ((BusinessRules)(handler)).ProcessSpecialActions(args, result);
                                    }
                                    else
                                    	CreateBusinessRules().ProcessSpecialActions(args, result);
            }
            catch (Exception ex)
            {
                if (ex.GetType() == typeof(System.Reflection.TargetInvocationException))
                	ex = ex.InnerException;
                HandleException(ex, args, result);
            }
            return result;
        }
        
        private bool SupportsLimitInSelect(object command)
        {
            return command.ToString().Contains("MySql");
        }
        
        protected virtual void SyncRequestedPage(PageRequest request, ViewPage page, DbConnection connection)
        {
            if (((request.SyncKey == null) || (request.SyncKey.Length == 0)) || (page.PageSize < 0))
            	return;
            List<DataField> keyFields = new List<DataField>();
            foreach (DataField field in page.Fields)
            	if (field.IsPrimaryKey)
                	keyFields.Add(field);
            if (keyFields.Count > 0)
            {
                DbCommand syncCommand = CreateCommand(connection);
                ConfigureCommand(syncCommand, page, CommandConfigurationType.Sync, null);
                for (int i = 0; (i < keyFields.Count); i++)
                {
                    DataField field = keyFields[i];
                    DbParameter p = syncCommand.CreateParameter();
                    p.ParameterName = String.Format("{0}PrimaryKey_{1}", _parameterMarker, field.Name);
                    AssignParameterValue(p, field.Type, request.SyncKey[i]);
                    syncCommand.Parameters.Add(p);
                }
                DbDataReader reader = syncCommand.ExecuteReader();
                if (reader.Read())
                {
                    long rowIndex = Convert.ToInt64(reader[0]);
                    page.PageIndex = Convert.ToInt32(Math.Floor((Convert.ToDouble((rowIndex - 1)) / Convert.ToDouble(page.PageSize))));
                    page.PageOffset = 0;
                }
                reader.Close();
            }
        }
        
        protected virtual void HandleException(Exception ex, ActionArgs args, ActionResult result)
        {
            while (ex != null)
            {
                result.Errors.Add(ex.Message);
                ex = ex.InnerException;
            }
        }
        
        DbDataReader IDataEngine.ExecuteReader(PageRequest request)
        {
            ViewPage page = new ViewPage(request);
            if (_config == null)
            {
                _config = CreateConfiguration(request.Controller);
                SelectView(request.Controller, request.View);
            }
            page.ApplyDataFilter(_config.CreateDataFilter(), request.Controller, request.View, null, null, null);
            DbConnection connection = CreateConnection();
            DbCommand selectCommand = CreateCommand(connection);
            ConfigureCommand(selectCommand, page, CommandConfigurationType.Select, null);
            return selectCommand.ExecuteReader(CommandBehavior.CloseConnection);
        }
        
        string[] IAutoCompleteManager.GetCompletionList(string prefixText, int count, string contextKey)
        {
            if (contextKey == null)
            	return null;
            string[] arguments = contextKey.Split(',');
            if (arguments.Length != 3)
            	return null;
            DistinctValueRequest request = new DistinctValueRequest();
            request.FieldName = arguments[2];
            string filter = (request.FieldName + ":");
            foreach (string s in prefixText.Split(',', ';'))
            {
                string query = Controller.ConvertSampleToQuery(s);
                if (!(String.IsNullOrEmpty(query)))
                	filter = (filter + query);
            }
            request.Filter = new string[] {
                    filter};
            request.AllowFieldInFilter = true;
            request.MaximumValueCount = count;
            request.Controller = arguments[0];
            request.View = arguments[1];
            object[] list = ControllerFactory.CreateDataController().GetListOfValues(arguments[0], arguments[1], request);
            List<string> result = new List<string>();
            foreach (object o in list)
            	result.Add(Convert.ToString(o));
            return result.ToArray();
        }
        
        void IBusinessObject.AssignFilter(string filter, BusinessObjectParameters parameters)
        {
            _viewFilter = filter;
            _parameters = parameters;
        }
        
        public static string GetSelectView(string controller)
        {
            ControllerUtilities c = new ControllerUtilities();
            return c.GetActionView(controller, "editForm1", "Select");
        }
        
        public static string GetUpdateView(string controller)
        {
            ControllerUtilities c = new ControllerUtilities();
            return c.GetActionView(controller, "editForm1", "Update");
        }
        
        public static string GetInsertView(string controller)
        {
            ControllerUtilities c = new ControllerUtilities();
            return c.GetActionView(controller, "createForm1", "Insert");
        }
        
        public static string GetDeleteView(string controller)
        {
            ControllerUtilities c = new ControllerUtilities();
            return c.GetActionView(controller, "editForm1", "Delete");
        }
        
        public virtual Stream GetDataControllerStream(string controller)
        {
            return null;
        }
        
        protected virtual DbDataReader ExecuteVirtualReader(PageRequest request, ViewPage page)
        {
            DataTable table = new DataTable();
            foreach (DataField field in page.Fields)
            	table.Columns.Add(field.Name, typeof(int));
            DataRow r = table.NewRow();
            if (page.ContainsField("PrimaryKey"))
            	r["PrimaryKey"] = 1;
            table.Rows.Add(r);
            return new DataTableReader(table);
        }
        
        protected virtual string GetRequestedViewType(ViewPage page)
        {
            string viewType = page.ViewType;
            if (String.IsNullOrEmpty(viewType))
            	viewType = _view.GetAttribute("type", String.Empty);
            return viewType;
        }
        
        protected virtual void EnsureSystemPageFields(PageRequest request, ViewPage page, DbCommand command)
        {
        }
        
        protected virtual bool RequiresHierarchy(ViewPage page)
        {
            return false;
        }
        
        protected virtual bool DatabaseEngineIs(DbCommand command, params System.String[] flavors)
        {
            return DatabaseEngineIs(command.GetType().FullName, flavors);
        }
        
        protected virtual bool DatabaseEngineIs(string typeName, params System.String[] flavors)
        {
            foreach (string s in flavors)
            	if (typeName.Contains(s))
                	return true;
            return false;
        }
        
        protected virtual bool ValidateViewAccess(string controller, string view, string access)
        {
            bool allow = true;
            return allow;
        }
        
        public delegate object SpecialConversionFunction(object o);
    }
    
    public partial class ControllerUtilities : ControllerUtilitiesBase
    {
    }
    
    public class ControllerUtilitiesBase
    {
        
        public static double UtcOffsetInMinutes
        {
            get
            {
                return TimeZone.CurrentTimeZone.GetUtcOffset(DateTime.Now).TotalMinutes;
            }
        }
        
        public virtual bool SupportsScrollingInDataSheet
        {
            get
            {
                return false;
            }
        }
        
        public virtual string GetActionView(string controller, string view, string action)
        {
            return view;
        }
        
        public virtual bool UserIsInRole(params System.String[] roles)
        {
            if (HttpContext.Current == null)
            	return true;
            int count = 0;
            foreach (string r in roles)
            	if (!(String.IsNullOrEmpty(r)))
                	foreach (string role in r.Split(','))
                    {
                        if (!(String.IsNullOrEmpty(role)) && HttpContext.Current.User.IsInRole(role.Trim()))
                        	return true;
                        count++;
                    }
            return (count == 0);
        }
        
        public virtual bool SupportsLastEnteredValues(string controller)
        {
            return false;
        }
        
        public virtual bool SupportsCaching(ViewPage page, string viewType)
        {
            if (viewType == "DataSheet")
            {
                if (!(SupportsScrollingInDataSheet) && !(ApplicationServices.IsMobileClient))
                	page.SupportsCaching = false;
            }
            else
            	if (viewType == "Grid")
                {
                    if (!(ApplicationServices.IsMobileClient))
                    	page.SupportsCaching = false;
                }
                else
                	page.SupportsCaching = false;
            return page.SupportsCaching;
        }
    }
    
    public class ControllerFactory
    {
        
        public static IDataController CreateDataController()
        {
            return new Controller();
        }
        
        public static IAutoCompleteManager CreateAutoCompleteManager()
        {
            return new Controller();
        }
        
        public static IDataEngine CreateDataEngine()
        {
            return new Controller();
        }
        
        public static Stream GetDataControllerStream(string controller)
        {
            return new Controller().GetDataControllerStream(controller);
        }
    }
    
    public partial class StringEncryptor : StringEncryptorBase
    {
    }
    
    public class StringEncryptorBase
    {
        
        public virtual string Encrypt(string s)
        {
            return Convert.ToBase64String(Encoding.Default.GetBytes(s));
        }
        
        public virtual string Decrypt(string s)
        {
            return Encoding.Default.GetString(Convert.FromBase64String(s));
        }
    }
}

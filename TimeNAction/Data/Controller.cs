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

namespace TimeNAction.Data
{
	public partial class DataControllerBase
    {
        
        private XPathNavigator _view;
        
        private string _viewId;
        
        private string _parameterMarker;
        
        private string _leftQuote;
        
        private string _rightQuote;
        
        private string _viewType;
        
        private ControllerConfiguration _config;
        
        private ViewPage _viewPage;
        
        private bool _viewOverridingDisabled;
        
        public static Regex SqlSelectRegex1 = new Regex("/\\*<select>\\*/(?\'Select\'[\\S\\s]*)?/\\*</select>\\*[\\S\\s]*?/\\*<from>\\*/(?\'From\'[\\S\\s]" +
                "*)?/\\*</from>\\*[\\S\\s]*?/\\*(<order-by>\\*/(?\'OrderBy\'[\\S\\s]*)?/\\*</order-by>\\*/)?", RegexOptions.IgnoreCase);
        
        public static Regex SqlSelectRegex2 = new Regex(@"\s*select\s*(?'Select'[\S\s]*)?\sfrom\s*(?'From'[\S\s]*)?\swhere\s*(?'Where'[\S\s]*)?\sorder\s+by\s*(?'OrderBy'[\S\s]*)?|\s*select\s*(?'Select'[\S\s]*)?\sfrom\s*(?'From'[\S\s]*)?\swhere\s*(?'Where'[\S\s]*)?|\s*select\s*(?'Select'[\S\s]*)?\sfrom\s*(?'From'[\S\s]*)?\sorder\s+by\s*(?'OrderBy'[\S\s]*)?|\s*select\s*(?'Select'[\S\s]*)?\sfrom\s*(?'From'[\S\s]*)?", RegexOptions.IgnoreCase);
        
        /// name regular expression:
        /// ^(?'Table'((\[|"|`)([\w\s]+)?(\]|"|`)|\w+)(\s*\.\s*((\[|"|`)([\w\s]+)?(\]|"|`)|\w+))*(\s*\.\s*((\[|"|`)([\w\s]+)?(\]|"|`)|\w+))*)(\s*(as|)\s*(\[|"|`|)([\w\s]+)?(\]|"|`|))
        public static Regex TableNameRegex = new Regex("^(?\'Table\'((\\[|\"|`)([\\w\\s]+)?(\\]|\"|`)|\\w+)(\\s*\\.\\s*((\\[|\"|`)([\\w\\s]+)?(\\]|\"|`)|\\w" +
                "+))*(\\s*\\.\\s*((\\[|\"|`)([\\w\\s]+)?(\\]|\"|`)|\\w+))*)(\\s*(as|)\\s*(\\[|\"|`|)([\\w\\s]+)?(" +
                "\\]|\"|`|))", RegexOptions.IgnoreCase);
        
        public static Regex ParamDetectionRegex = new Regex("(?:(\\W|^))(?\'Parameter\'(@|:)\\w+)");
        
        public static Regex SelectExpressionRegex = new Regex("\\s*(?\'Expression\'[\\S\\s]*?(\\([\\s\\S]*?\\)|(\\.((\"|\'|\\[|`)(?\'FieldName\'[\\S\\s]*?)(\"|\'|\\" +
                "]|`))|(\"|\'|\\[|`|)(?\'FieldName\'[\\w\\s]*?)(\"|\'|\\]|)|)))((\\s+as\\s+|\\s+)(\"|\'|\\[|`|)(?" +
                "\'Alias\'[\\S\\s]*?)|)(\"|\'|\\]|`|)\\s*(,|$)", RegexOptions.IgnoreCase);
        
        private static SortedDictionary<string, Type> _typeMap;
        
        public virtual ControllerConfiguration Config
        {
            get
            {
                return _config;
            }
        }
        
        private IXmlNamespaceResolver Resolver
        {
            get
            {
                return _config.Resolver;
            }
        }
        
        public bool ViewOverridingDisabled
        {
            get
            {
                return _viewOverridingDisabled;
            }
            set
            {
                _viewOverridingDisabled = value;
            }
        }
        
        public static SortedDictionary<string, Type> TypeMap
        {
            get
            {
                return _typeMap;
            }
        }
        
        protected virtual bool YieldsSingleRow(DbCommand command)
        {
            return ((command == null) || (command.CommandText.IndexOf("count(*)") == -1));
        }
        
        protected string CreateValueFromSourceFields(DataField field, DbDataReader reader)
        {
            string v = String.Empty;
            if (DBNull.Value.Equals(reader[field.Name]))
            	v = "null";
            Match m = Regex.Match(field.SourceFields, "(\\w+)\\s*(,|$)");
            while (m.Success)
            {
                if (v.Length > 0)
                	v = (v + "|");
                v = (v + Convert.ToString(reader[m.Groups[1].Value]));
                m = m.NextMatch();
            }
            return v;
        }
        
        private void PopulatePageCategories(ViewPage page)
        {
            XPathNodeIterator categoryIterator = _view.Select("c:categories/c:category", Resolver);
            while (categoryIterator.MoveNext())
            	page.Categories.Add(new Category(categoryIterator.Current, Resolver));
            if (page.Categories.Count == 0)
            	page.Categories.Add(new Category());
        }
        
        protected ViewPage CreateViewPage()
        {
            if (_viewPage == null)
            {
                _viewPage = new ViewPage();
                PopulatePageFields(_viewPage);
                EnsurePageFields(_viewPage, null);
            }
            return _viewPage;
        }
        
        void PopulateDynamicLookups(ActionArgs args, ActionResult result)
        {
            ViewPage page = CreateViewPage();
            foreach (DataField field in page.Fields)
            	if (page.PopulateStaticItems(field, args.Values))
                	result.Values.Add(new FieldValue(field.Name, field.Items.ToArray()));
        }
        
        public static bool UserIsInRole(params System.String[] roles)
        {
            return new ControllerUtilities().UserIsInRole(roles);
        }
        
        private void ExecutePostActionCommands(ActionArgs args, ActionResult result, DbConnection connection)
        {
            if (!(TransactionManager.InTransaction(args)))
            {
                string eventName = String.Empty;
                if (args.CommandName.Equals("insert", StringComparison.OrdinalIgnoreCase))
                	eventName = "Inserted";
                else
                	if (args.CommandName.Equals("update", StringComparison.OrdinalIgnoreCase))
                    	eventName = "Updated";
                    else
                    	if (args.CommandName.Equals("delete", StringComparison.OrdinalIgnoreCase))
                        	eventName = "Deleted";
                XPathNodeIterator eventCommandIterator = _config.Select("/c:dataController/c:commands/c:command[@event=\'{0}\']", eventName);
                while (eventCommandIterator.MoveNext())
                	ExecuteActionCommand(args, result, connection, eventCommandIterator.Current);
            }
            if (new ControllerUtilities().SupportsLastEnteredValues(args.Controller))
            {
                if ((args.SaveLEVs && (HttpContext.Current.Session != null)) && ((args.CommandName == "Insert") || (args.CommandName == "Update")))
                	HttpContext.Current.Session[String.Format("{0}$LEVs", args.Controller)] = args.Values;
            }
        }
        
        private void ExecuteActionCommand(ActionArgs args, ActionResult result, DbConnection connection, XPathNavigator commandNavigator)
        {
            DbCommand command = SqlStatement.CreateCommand(connection);
            command.CommandType = ((CommandType)(TypeDescriptor.GetConverter(typeof(CommandType)).ConvertFromString(((string)(commandNavigator.Evaluate("string(@type)"))))));
            command.CommandText = ((string)(commandNavigator.Evaluate("string(c:text)", Resolver)));
            DbDataReader reader = command.ExecuteReader();
            if (reader.Read())
            {
                int outputIndex = 0;
                XPathNodeIterator outputIterator = commandNavigator.Select("c:output/c:*", Resolver);
                while (outputIterator.MoveNext())
                {
                    if (outputIterator.Current.LocalName == "fieldOutput")
                    {
                        string name = ((string)(outputIterator.Current.Evaluate("string(@name)")));
                        string fieldName = ((string)(outputIterator.Current.Evaluate("string(@fieldName)")));
                        foreach (FieldValue v in args.Values)
                        	if (v.Name == fieldName)
                            {
                                if (String.IsNullOrEmpty(name))
                                	v.NewValue = reader[outputIndex];
                                else
                                	v.NewValue = reader[name];
                                if ((v.NewValue != null) && ((v.NewValue.GetType() == typeof(byte[])) && (((byte[])(v.NewValue)).Length == 16)))
                                	v.NewValue = new Guid(((byte[])(v.NewValue)));
                                v.Modified = true;
                                if (result != null)
                                	result.Values.Add(v);
                                break;
                            }
                    }
                    outputIndex++;
                }
            }
            reader.Close();
        }
        
        private void ExecutePreActionCommands(ActionArgs args, ActionResult result, DbConnection connection)
        {
            if (TransactionManager.InTransaction(args))
            	return;
            string eventName = String.Empty;
            if (args.CommandName.Equals("insert", StringComparison.OrdinalIgnoreCase))
            	eventName = "Inserting";
            else
            	if (args.CommandName.Equals("update", StringComparison.OrdinalIgnoreCase))
                	eventName = "Updating";
                else
                	if (args.CommandName.Equals("delete", StringComparison.OrdinalIgnoreCase))
                    	eventName = "Deleting";
            XPathNodeIterator eventCommandIterator = _config.Select("/c:dataController/c:commands/c:command[@event=\'{0}\']", eventName);
            while (eventCommandIterator.MoveNext())
            	ExecuteActionCommand(args, result, connection, eventCommandIterator.Current);
        }
        
        protected virtual ControllerConfiguration CreateConfiguration(string controllerName)
        {
            return Controller.CreateConfigurationInstance(GetType(), controllerName);
        }
        
        public static ControllerConfiguration CreateConfigurationInstance(Type t, string controller)
        {
            string configKey = ("DataController_" + controller);
            ControllerConfiguration config = ((ControllerConfiguration)(HttpContext.Current.Items[configKey]));
            if (config != null)
            	return config;
            config = ((ControllerConfiguration)(HttpRuntime.Cache[configKey]));
            if (config == null)
            {
                Stream res = ControllerFactory.GetDataControllerStream(controller);
                bool allowCaching = (res == null);
                if (res == DefaultDataControllerStream)
                	res = null;
                if (res == null)
                	res = t.Assembly.GetManifestResourceStream(String.Format("TimeNAction.Controllers.{0}.xml", controller));
                if (res == null)
                	res = t.Assembly.GetManifestResourceStream(String.Format("TimeNAction.{0}.xml", controller));
                if (res == null)
                {
                    string controllerPath = Path.Combine(Path.Combine(HttpRuntime.AppDomainAppPath, "Controllers"), (controller + ".xml"));
                    if (!(File.Exists(controllerPath)))
                    	throw new Exception(String.Format("Controller \'{0}\' does not exist.", controller));
                    config = new ControllerConfiguration(controllerPath);
                    if (allowCaching)
                    	HttpRuntime.Cache.Insert(configKey, config, new CacheDependency(controllerPath));
                }
                else
                {
                    config = new ControllerConfiguration(res);
                    if (allowCaching)
                    	HttpRuntime.Cache.Insert(configKey, config);
                }
            }
            bool requiresLocalization = config.RequiresLocalization;
            if (config.UsesVariables)
            	config = config.Clone();
            config = config.EnsureVitalElements();
            if (config.PlugIn != null)
            	config = config.PlugIn.Create(config);
            if (requiresLocalization)
            	config = config.Localize(controller);
            config.Complete();
            HttpContext.Current.Items[configKey] = config;
            return config;
        }
        
        public virtual void SelectView(string controller, string view)
        {
            _config = CreateConfiguration(controller);
            XPathNodeIterator iterator = null;
            if (String.IsNullOrEmpty(view))
            	iterator = _config.Select("/c:dataController/c:views/c:view[1]");
            else
            	iterator = _config.Select("/c:dataController/c:views/c:view[@id=\'{0}\']", view);
            if (!(iterator.MoveNext()))
            	throw new Exception(String.Format("The view \'{0}\' does not exist.", view));
            _view = iterator.Current;
            _viewId = iterator.Current.GetAttribute("id", String.Empty);
            if (!(ViewOverridingDisabled))
            {
                XPathNodeIterator overrideIterator = _config.Select("/c:dataController/c:views/c:view[@virtualViewId=\'{0}\']", _viewId);
                while (overrideIterator.MoveNext())
                {
                    string viewId = overrideIterator.Current.GetAttribute("id", String.Empty);
                    BusinessRules rules = _config.CreateBusinessRules();
                    if ((rules != null) && rules.IsOverrideApplicable(controller, viewId, _viewId))
                    {
                        _view = overrideIterator.Current;
                        break;
                    }
                }
            }
            _viewType = iterator.Current.GetAttribute("type", String.Empty);
            string accessType = iterator.Current.GetAttribute("access", String.Empty);
            if (String.IsNullOrEmpty(accessType))
            	accessType = "Private";
            if (!(ValidateViewAccess(controller, _viewId, accessType)))
            	throw new Exception(String.Format("Not authorized to access private view \'{0}\' in data controller \'{1}\'. Set \'Access" +
                            "\' property of the view to \'Public\' or enable \'Idle User Detection\' to automatica" +
                            "lly logout user after a period of inactivity.", _viewId, controller));
        }
        
        protected virtual DbConnection CreateConnection()
        {
            ConnectionStringSettings settings = ConnectionStringSettingsFactory.Create(_config.ConnectionStringName);
            if (settings == null)
            	throw new Exception(String.Format("Connection string \'{0}\' is not defined in web.config of this application.", _config.ConnectionStringName));
            DbProviderFactory factory = DbProviderFactories.GetFactory(settings.ProviderName);
            DbConnection connection = factory.CreateConnection();
            string connectionString = settings.ConnectionString;
            if (SupportsLimitInSelect(connection))
            	connectionString = (connectionString + "Allow User Variables=True");
            connection.ConnectionString = connectionString;
            connection.Open();
            _parameterMarker = SqlStatement.ConvertTypeToParameterMarker(settings.ProviderName);
            _leftQuote = SqlStatement.ConvertTypeToLeftQuote(settings.ProviderName);
            _rightQuote = SqlStatement.ConvertTypeToRightQuote(settings.ProviderName);
            return connection;
        }
        
        protected virtual DbCommand CreateCommand(DbConnection connection)
        {
            return CreateCommand(connection, null);
        }
        
        protected virtual DbCommand CreateCommand(DbConnection connection, ActionArgs args)
        {
            string commandId = _view.GetAttribute("commandId", String.Empty);
            XPathNavigator commandNav = _config.SelectSingleNode("/c:dataController/c:commands/c:command[@id=\'{0}\']", commandId);
            if ((args != null) && !(String.IsNullOrEmpty(args.CommandArgument)))
            {
                XPathNavigator commandNav2 = _config.SelectSingleNode("/c:dataController/c:commands/c:command[@id=\'{0}\']", args.CommandArgument);
                if (commandNav2 != null)
                	commandNav = commandNav2;
            }
            if (commandNav == null)
            	return null;
            DbCommand command = SqlStatement.CreateCommand(connection);
            if (SinglePhaseTransactionScope.Current != null)
            	SinglePhaseTransactionScope.Current.Enlist(command);
            string theCommandType = commandNav.GetAttribute("type", string.Empty);
            if (!(String.IsNullOrEmpty(theCommandType)))
            	command.CommandType = ((CommandType)(TypeDescriptor.GetConverter(typeof(CommandType)).ConvertFromString(theCommandType)));
            command.CommandText = ((string)(commandNav.Evaluate("string(c:text)", Resolver)));
            if (String.IsNullOrEmpty(command.CommandText))
            	command.CommandText = commandNav.InnerXml;
            if ((command.CommandType == CommandType.StoredProcedure) || commandNav.Select("c:parameters/c:parameter", Resolver).MoveNext())
            	throw new Exception("Commands of type Stored Procedure and command parameters are available in Premium" +
                        " edition only.");
            return command;
        }
        
        protected virtual bool ConfigureCommand(DbCommand command, ViewPage page, CommandConfigurationType commandConfiguration, FieldValue[] values)
        {
            if (page == null)
            	page = new ViewPage();
            PopulatePageFields(page);
            if (command == null)
            	return true;
            if (command.CommandType == CommandType.Text)
            {
                Match statementMatch = SqlSelectRegex1.Match(command.CommandText);
                if (!(statementMatch.Success))
                	statementMatch = SqlSelectRegex2.Match(command.CommandText);
                SelectClauseDictionary expressions = ParseSelectExpressions(statementMatch.Groups["Select"].Value);
                EnsurePageFields(page, expressions);
                AddComputedExpressions(expressions, page);
                if (statementMatch.Success)
                {
                    string fromClause = statementMatch.Groups["From"].Value;
                    string whereClause = statementMatch.Groups["Where"].Value;
                    string orderByClause = statementMatch.Groups["OrderBy"].Value;
                    string tableName = null;
                    if (!(commandConfiguration.ToString().StartsWith("Select")))
                    	tableName = ((string)(_config.Evaluate("string(/c:dataController/c:commands/c:command[@id=\'{0}\']/@tableName)", _view.GetAttribute("commandId", String.Empty))));
                    if (String.IsNullOrEmpty(tableName))
                    	tableName = TableNameRegex.Match(fromClause).Groups["Table"].Value;
                    if (commandConfiguration == CommandConfigurationType.Update)
                    	return ConfigureCommandForUpdate(command, page, expressions, tableName, values);
                    else
                    	if (commandConfiguration == CommandConfigurationType.Insert)
                        	return ConfigureCommandForInsert(command, page, expressions, tableName, values);
                        else
                        	if (commandConfiguration == CommandConfigurationType.Delete)
                            	return ConfigureCommandForDelete(command, page, expressions, tableName, values);
                            else
                            {
                                ConfigureCommandForSelect(command, page, expressions, fromClause, whereClause, orderByClause, commandConfiguration);
                                ProcessExpressionParameters(command, expressions);
                            }
                }
                else
                	if ((commandConfiguration == CommandConfigurationType.Select) && YieldsSingleRow(command))
                    {
                        StringBuilder sb = new StringBuilder();
                        sb.Append("select ");
                        AppendSelectExpressions(sb, page, expressions, true);
                        command.CommandText = sb.ToString();
                    }
                return commandConfiguration != CommandConfigurationType.None;
            }
            return (command.CommandType == CommandType.StoredProcedure);
        }
        
        private void ProcessExpressionParameters(DbCommand command, SelectClauseDictionary expressions)
        {
            foreach (string fieldName in expressions.Keys)
            {
                this._currentCommand = command;
                string formula = expressions[fieldName];
                Match m = ParamDetectionRegex.Match(formula);
                if (m.Success)
                	AssignFilterParameterValue(m.Groups[3].Value);
            }
        }
        
        private void AddComputedExpressions(SelectClauseDictionary expressions, ViewPage page)
        {
            foreach (DataField field in page.Fields)
            	if (!(String.IsNullOrEmpty(field.Formula)))
                	expressions[field.ExpressionName()] = String.Format("({0})", field.Formula);
        }
        
        private bool ConfigureCommandForDelete(DbCommand command, ViewPage page, SelectClauseDictionary expressions, string tableName, FieldValue[] values)
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendFormat("delete from {0}", tableName);
            AppendWhereExpressions(sb, command, page, expressions, values);
            command.CommandText = sb.ToString();
            return true;
        }
        
        private bool ConfigureCommandForInsert(DbCommand command, ViewPage page, SelectClauseDictionary expressions, string tableName, FieldValue[] values)
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendFormat("insert into {0} (", tableName);
            bool firstField = true;
            foreach (FieldValue v in values)
            {
                DataField field = page.FindField(v.Name);
                if ((field != null) && v.Modified)
                {
                    sb.AppendLine();
                    if (firstField)
                    	firstField = false;
                    else
                    	sb.Append(",");
                    sb.AppendFormat(RemoveTableAliasFromExpression(expressions[v.Name]));
                }
            }
            if (firstField)
            	return false;
            sb.AppendLine(")");
            sb.AppendLine("values(");
            firstField = true;
            foreach (FieldValue v in values)
            {
                DataField field = page.FindField(v.Name);
                if ((field != null) && v.Modified)
                {
                    sb.AppendLine();
                    if (firstField)
                    	firstField = false;
                    else
                    	sb.Append(",");
                    if ((v.NewValue == null) && field.HasDefaultValue)
                    	sb.Append(field.DefaultValue);
                    else
                    {
                        sb.AppendFormat("{0}p{1}", _parameterMarker, command.Parameters.Count);
                        DbParameter parameter = command.CreateParameter();
                        parameter.ParameterName = String.Format("{0}p{1}", _parameterMarker, command.Parameters.Count);
                        AssignParameterValue(parameter, field.Type, v.NewValue);
                        command.Parameters.Add(parameter);
                    }
                }
            }
            sb.AppendLine(")");
            command.CommandText = sb.ToString();
            return true;
        }
        
        private string RemoveTableAliasFromExpression(string expression)
        {
            // alias extraction regular expression:
            // "[\w\s]+".("[\w\s]+")
            Match m = Regex.Match(expression, "\"[\\w\\s]+\".(\"[\\w\\s]+\")");
            if (m.Success)
            	return m.Groups[1].Value;
            return expression;
        }
        
        private bool ConfigureCommandForUpdate(DbCommand command, ViewPage page, SelectClauseDictionary expressions, string tableName, FieldValue[] values)
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendFormat("update {0} set ", tableName);
            bool firstField = true;
            foreach (FieldValue v in values)
            {
                DataField field = page.FindField(v.Name);
                if ((field != null) && v.Modified)
                {
                    sb.AppendLine();
                    if (firstField)
                    	firstField = false;
                    else
                    	sb.Append(",");
                    sb.AppendFormat(RemoveTableAliasFromExpression(expressions[v.Name]));
                    if ((v.NewValue == null) && field.HasDefaultValue)
                    	sb.Append(String.Format("={0}", field.DefaultValue));
                    else
                    {
                        sb.AppendFormat("={0}p{1}", _parameterMarker, command.Parameters.Count);
                        DbParameter parameter = command.CreateParameter();
                        parameter.ParameterName = String.Format("{0}p{1}", _parameterMarker, command.Parameters.Count);
                        AssignParameterValue(parameter, field.Type, v.NewValue);
                        command.Parameters.Add(parameter);
                    }
                }
            }
            if (firstField)
            	return false;
            AppendWhereExpressions(sb, command, page, expressions, values);
            command.CommandText = sb.ToString();
            return true;
        }
        
        private void ConfigureCommandForSelect(DbCommand command, ViewPage page, SelectClauseDictionary expressions, string fromClause, string whereClause, string orderByClause, CommandConfigurationType commandConfiguration)
        {
            bool useServerPaging = (commandConfiguration != CommandConfigurationType.SelectDistinct && (commandConfiguration != CommandConfigurationType.SelectAggregates && commandConfiguration != CommandConfigurationType.SelectFirstLetters));
            bool useLimit = SupportsLimitInSelect(command);
            if (useServerPaging)
            	page.AcceptAllRows();
            StringBuilder sb = new StringBuilder();
            if (useLimit)
            	useServerPaging = false;
            bool countUsingHierarchy = false;
            if ((commandConfiguration == CommandConfigurationType.SelectCount) && (useServerPaging && RequiresHierarchy(page)))
            {
                countUsingHierarchy = true;
                commandConfiguration = CommandConfigurationType.Select;
            }
            if (commandConfiguration == CommandConfigurationType.SelectCount)
            	sb.AppendLine("select count(*)");
            else
            {
                if (useServerPaging)
                	sb.AppendLine("with page_cte__ as (");
                else
                	if ((commandConfiguration == CommandConfigurationType.Sync) && useLimit)
                    	sb.Append("select * from (select @row_num := @row_num+1 row_number__,cte__.* from (select @r" +
                                "ow_num:=0) r,(");
                sb.AppendLine("select");
                if (useServerPaging)
                	AppendRowNumberExpression(sb, page, expressions, orderByClause);
                if (commandConfiguration == CommandConfigurationType.SelectDistinct)
                {
                    DataField distinctField = page.FindField(page.DistinctValueFieldName);
                    string distinctExpression = expressions[distinctField.ExpressionName()];
                    if (distinctField.Type.StartsWith("Date"))
                    {
                        string commandType = command.GetType().ToString();
                        if (commandType == "System.Data.SqlClient.SqlCommand")
                        	distinctExpression = String.Format("DATEADD(dd, 0, DATEDIFF(dd, 0, {0}))", distinctExpression);
                        if (commandType == "MySql.Data.MySqlClient.MySqlCommand")
                        	distinctExpression = String.Format("cast({0} as date)", distinctExpression);
                    }
                    sb.AppendFormat("distinct {0} \"{1}\"\r\n", distinctExpression, page.DistinctValueFieldName);
                }
                else
                	if (commandConfiguration == CommandConfigurationType.SelectAggregates)
                    	AppendAggregateExpressions(sb, page, expressions);
                    else
                    	if (commandConfiguration == CommandConfigurationType.SelectFirstLetters)
                        {
                            string substringFunction = "substring";
                            if (DatabaseEngineIs(command, "Oracle", "DB2"))
                            	substringFunction = "substr";
                            AppendFirstLetterExpressions(sb, page, expressions, substringFunction);
                        }
                        else
                        	AppendSelectExpressions(sb, page, expressions, !(useServerPaging));
            }
            sb.AppendLine("from");
            sb.AppendLine(fromClause);
            _hasWhere = false;
            if (String.IsNullOrEmpty(_viewFilter))
            {
                _viewFilter = _view.GetAttribute("filter", String.Empty);
                if (String.IsNullOrEmpty(_viewFilter) && ((_viewType == "Form") && !(String.IsNullOrEmpty(page.LastView))))
                {
                    XPathNavigator lastView = _config.SelectSingleNode("/c:dataController/c:views/c:view[@id=\'{0}\']", page.LastView);
                    if (lastView != null)
                    	_viewFilter = lastView.GetAttribute("filter", String.Empty);
                }
            }
            if (!(String.IsNullOrEmpty(_viewFilter)))
            	_viewFilter = String.Format("({0})", _viewFilter);
            AppendSystemFilter(command, page, expressions);
            if (((page.Filter != null) && (page.Filter.Length > 0)) || !(String.IsNullOrEmpty(_viewFilter)))
            	AppendFilterExpressionsToWhere(sb, page, command, expressions, whereClause);
            else
            	if (!(String.IsNullOrEmpty(whereClause)))
                {
                    EnsureWhereKeyword(sb);
                    sb.AppendLine(whereClause);
                }
            if (commandConfiguration == CommandConfigurationType.Select)
            {
                string viewType = page.ViewType;
                if (String.IsNullOrEmpty(viewType))
                	viewType = _view.GetAttribute("type", String.Empty);
                bool preFetch = (page.PageSize != Int32.MaxValue && new ControllerUtilities().SupportsCaching(page, viewType));
                if (useServerPaging)
                {
                    if (!(ConfigureCTE(sb, page, command, expressions, countUsingHierarchy)))
                    	sb.Append(")\r\nselect * from page_cte__ ");
                    if (!(countUsingHierarchy))
                    {
                        sb.AppendFormat("where row_number__ > {0}PageRangeFirstRowNumber and row_number__ <= {0}PageRangeL" +
                                "astRowNumber", _parameterMarker);
                        DbParameter p = command.CreateParameter();
                        p.ParameterName = (_parameterMarker + "PageRangeFirstRowNumber");
                        p.Value = ((page.PageSize * page.PageIndex) 
                                    + page.PageOffset);
                        if (preFetch)
                        	p.Value = (((int)(p.Value)) - page.PageSize);
                        command.Parameters.Add(p);
                        DbParameter p2 = command.CreateParameter();
                        p2.ParameterName = (_parameterMarker + "PageRangeLastRowNumber");
                        p2.Value = ((page.PageSize 
                                    * (page.PageIndex + 1)) 
                                    + page.PageOffset);
                        if (preFetch)
                        	p2.Value = (((int)(p2.Value)) + page.PageSize);
                        command.Parameters.Add(p2);
                    }
                }
                else
                {
                    AppendOrderByExpression(sb, page, expressions, orderByClause);
                    if (useLimit)
                    {
                        sb.AppendFormat("\r\nlimit {0}Limit_PageOffset, {0}Limit_PageSize", _parameterMarker);
                        DbParameter p = command.CreateParameter();
                        p.ParameterName = (_parameterMarker + "Limit_PageOffset");
                        p.Value = ((page.PageSize * page.PageIndex) 
                                    + page.PageOffset);
                        if (preFetch && (((int)(p.Value)) > page.PageSize))
                        	p.Value = (((int)(p.Value)) - page.PageSize);
                        command.Parameters.Add(p);
                        DbParameter p2 = command.CreateParameter();
                        p2.ParameterName = (_parameterMarker + "Limit_PageSize");
                        p2.Value = page.PageSize;
                        if (preFetch)
                        {
                            int pagesToFetch = 2;
                            if (((int)(p.Value)) > page.PageSize)
                            	pagesToFetch = 3;
                            p2.Value = (page.PageSize * pagesToFetch);
                        }
                        command.Parameters.Add(p2);
                    }
                }
            }
            else
            	if (commandConfiguration == CommandConfigurationType.Sync)
                {
                    if (useServerPaging)
                    {
                        if (!(ConfigureCTE(sb, page, command, expressions, false)))
                        	sb.Append(")\r\nselect * from page_cte__ ");
                        sb.Append("where ");
                    }
                    else
                    {
                        if (useLimit)
                        	AppendOrderByExpression(sb, page, expressions, orderByClause);
                        sb.Append(") cte__)cte2__ where ");
                    }
                    bool first = true;
                    foreach (DataField field in page.Fields)
                    	if (field.IsPrimaryKey)
                        {
                            if (first)
                            	first = false;
                            else
                            	sb.AppendFormat(" and ");
                            sb.AppendFormat("{1}={0}PrimaryKey_{1}", _parameterMarker, field.Name);
                        }
                }
                else
                	if ((commandConfiguration == CommandConfigurationType.SelectDistinct) || (commandConfiguration == CommandConfigurationType.SelectFirstLetters))
                    	sb.Append("order by 1");
            command.CommandText = sb.ToString();
            _viewFilter = null;
        }
        
        protected virtual bool ConfigureCTE(StringBuilder sb, ViewPage page, DbCommand command, SelectClauseDictionary expressions, bool performCount)
        {
            return false;
        }
        
        private void AppendFirstLetterExpressions(StringBuilder sb, ViewPage page, SelectClauseDictionary expressions, string substringFunction)
        {
            foreach (DataField field in page.Fields)
            	if ((!(field.Hidden) && field.AllowQBE) && (field.Type == "String"))
                {
                    string fieldName = field.AliasName;
                    if (String.IsNullOrEmpty(fieldName))
                    	fieldName = field.Name;
                    sb.AppendFormat("distinct {1}({0},1,1) first_letter__\r\n", expressions[fieldName], substringFunction);
                    page.FirstLetters = fieldName;
                    page.RemoveFromFilter(fieldName);
                    break;
                }
        }
        
        public static void AssignParameterDbType(DbParameter parameter, string systemType)
        {
            if (systemType == "SByte")
            	parameter.DbType = DbType.Int16;
            else
            	if (systemType == "TimeSpan")
                	parameter.DbType = DbType.String;
                else
                	if ((systemType == "Guid") && parameter.GetType().Name.Contains("Oracle"))
                    	parameter.DbType = DbType.Binary;
                    else
                    	parameter.DbType = ((DbType)(TypeDescriptor.GetConverter(typeof(DbType)).ConvertFrom(systemType)));
        }
        
        public static void AssignParameterValue(DbParameter parameter, string systemType, object v)
        {
            AssignParameterDbType(parameter, systemType);
            if (v == null)
            	parameter.Value = DBNull.Value;
            else
            {
                if (parameter.DbType == DbType.String)
                	parameter.Value = v.ToString();
                else
                	parameter.Value = ConvertToType(Controller.TypeMap[systemType], v);
                if ((parameter.DbType == DbType.Binary) && (parameter.Value is Guid))
                	parameter.Value = ((Guid)(parameter.Value)).ToByteArray();
            }
        }
        
        private void AppendSelectExpressions(StringBuilder sb, ViewPage page, SelectClauseDictionary expressions, bool firstField)
        {
            foreach (DataField field in page.Fields)
            {
                if (firstField)
                	firstField = false;
                else
                	sb.Append(",");
                try
                {
                    if (field.OnDemand)
                    	sb.Append(String.Format("case when {0} is not null then 1 else null end as ", expressions[field.ExpressionName()]));
                    else
                    	sb.Append(expressions[field.ExpressionName()]);
                }
                catch (Exception )
                {
                    throw new Exception(String.Format("Unknown data field \'{0}\'.", field.Name));
                }
                sb.Append(" \"");
                sb.Append(field.Name);
                sb.AppendLine("\"");
            }
        }
        
        void AppendAggregateExpressions(StringBuilder sb, ViewPage page, SelectClauseDictionary expressions)
        {
            bool firstField = true;
            foreach (DataField field in page.Fields)
            {
                if (firstField)
                	firstField = false;
                else
                	sb.Append(",");
                if (field.Aggregate == DataFieldAggregate.None)
                	sb.Append("null ");
                else
                {
                    string functionName = field.Aggregate.ToString();
                    if (functionName == "Average")
                    	functionName = "Avg";
                    string fmt = "{0}({1})";
                    if (functionName == "Count")
                    	fmt = "{0}(distinct {1})";
                    sb.AppendFormat(fmt, functionName, expressions[field.ExpressionName()]);
                }
                sb.Append(" \"");
                sb.Append(field.Name);
                sb.AppendLine("\"");
            }
        }
        
        private void AppendRowNumberExpression(StringBuilder sb, ViewPage page, SelectClauseDictionary expressions, string orderByClause)
        {
            sb.Append("row_number() over (");
            AppendOrderByExpression(sb, page, expressions, orderByClause);
            sb.AppendLine(") as row_number__");
        }
        
        private void AppendOrderByExpression(StringBuilder sb, ViewPage page, SelectClauseDictionary expressions, string orderByClause)
        {
            if (String.IsNullOrEmpty(page.SortExpression))
            	page.SortExpression = _view.GetAttribute("sortExpression", String.Empty);
            bool hasOrderBy = false;
            sb.Append("order by ");
            if (String.IsNullOrEmpty(page.SortExpression))
            {
                if (!(String.IsNullOrEmpty(orderByClause)))
                {
                    sb.Append(orderByClause);
                    hasOrderBy = true;
                }
            }
            else
            {
                bool firstSortField = true;
                Match orderByMatch = Regex.Match(page.SortExpression, "\\s*(?\'Alias\'[\\s\\w]+?)\\s*(?\'Order\'\\s(ASC|DESC))?\\s*(,|$)", RegexOptions.IgnoreCase);
                while (orderByMatch.Success)
                {
                    if (firstSortField)
                    	firstSortField = false;
                    else
                    	sb.Append(",");
                    string fieldName = orderByMatch.Groups["Alias"].Value;
                    if (fieldName.EndsWith("_Mirror"))
                    	fieldName = fieldName.Substring(0, (fieldName.Length - 7));
                    sb.Append(expressions[fieldName]);
                    sb.Append(" ");
                    sb.Append(orderByMatch.Groups["Order"].Value);
                    orderByMatch = orderByMatch.NextMatch();
                    hasOrderBy = true;
                }
            }
            bool firstKey = !(hasOrderBy);
            foreach (DataField field in page.Fields)
            	if (field.IsPrimaryKey)
                {
                    if (firstKey)
                    	firstKey = false;
                    else
                    	sb.Append(",");
                    sb.Append(expressions[field.ExpressionName()]);
                }
            if (firstKey)
            	sb.Append(expressions[page.Fields[0].ExpressionName()]);
        }
        
        private void EnsurePageFields(ViewPage page, SelectClauseDictionary expressions)
        {
            XPathNavigator statusBar = _config.SelectSingleNode("/c:dataController/c:statusBar");
            if (statusBar != null)
            	page.StatusBar = statusBar.Value;
            if (page.Fields.Count == 0)
            {
                XPathNodeIterator fieldIterator = _config.Select("/c:dataController/c:fields/c:field");
                while (fieldIterator.MoveNext())
                {
                    string fieldName = fieldIterator.Current.GetAttribute("name", String.Empty);
                    if (expressions.ContainsKey(fieldName))
                    	page.Fields.Add(new DataField(fieldIterator.Current, Resolver));
                }
            }
            XPathNodeIterator keyFieldIterator = _config.Select("/c:dataController/c:fields/c:field[@isPrimaryKey=\'true\' or @hidden=\'true\']");
            while (keyFieldIterator.MoveNext())
            {
                string fieldName = keyFieldIterator.Current.GetAttribute("name", String.Empty);
                if (!(page.ContainsField(fieldName)))
                	page.Fields.Add(new DataField(keyFieldIterator.Current, Resolver, true));
            }
            XPathNodeIterator aliasIterator = _view.Select(".//c:dataFields/c:dataField/@aliasFieldName", Resolver);
            while (aliasIterator.MoveNext())
            	if (!(page.ContainsField(aliasIterator.Current.Value)))
                {
                    XPathNodeIterator fieldIterator = _config.Select("/c:dataController/c:fields/c:field[@name=\'{0}\']", aliasIterator.Current.Value);
                    if (fieldIterator.MoveNext())
                    	page.Fields.Add(new DataField(fieldIterator.Current, Resolver, true));
                }
            XPathNodeIterator lookupFieldIterator = _config.Select("/c:dataController/c:fields/c:field[c:items/@dataController]");
            while (lookupFieldIterator.MoveNext())
            {
                string fieldName = lookupFieldIterator.Current.GetAttribute("name", String.Empty);
                if (!(page.ContainsField(fieldName)))
                	page.Fields.Add(new DataField(lookupFieldIterator.Current, Resolver, true));
            }
            int i = 0;
            while (i < page.Fields.Count)
            {
                DataField field = page.Fields[i];
                if ((!(field.FormatOnClient) && !(String.IsNullOrEmpty(field.DataFormatString))) && !(field.IsMirror))
                {
                    page.Fields.Insert((i + 1), new DataField(field));
                    i = (i + 2);
                }
                else
                	i++;
            }
            XPathNodeIterator dynamicConfigIterator = _config.Select("/c:dataController/c:fields/c:field[c:configuration!=\'\']/c:configuration|/c:dataCo" +
                    "ntroller/c:fields/c:field/c:items[@copy!=\'\']/@copy");
            while (dynamicConfigIterator.MoveNext())
            {
                Match dynamicConfig = Regex.Match(dynamicConfigIterator.Current.Value, "(\\w+)=(\\w+)");
                while (dynamicConfig.Success)
                {
                    int groupIndex = 2;
                    if (dynamicConfigIterator.Current.Name == "copy")
                    	groupIndex = 1;
                    if (!(page.ContainsField(dynamicConfig.Groups[groupIndex].Value)))
                    {
                        XPathNavigator nav = _config.SelectSingleNode("/c:dataController/c:fields/c:field[@name=\'{0}\']", dynamicConfig.Groups[1].Value);
                        if (nav != null)
                        	page.Fields.Add(new DataField(nav, Resolver, true));
                    }
                    dynamicConfig = dynamicConfig.NextMatch();
                }
                if (page.InTransaction)
                {
                    XPathNodeIterator globalFieldIterator = _config.Select("/c:dataController/c:fields/c:field");
                    while (globalFieldIterator.MoveNext())
                    {
                        string fieldName = globalFieldIterator.Current.GetAttribute("name", String.Empty);
                        if (!(page.ContainsField(fieldName)))
                        	page.Fields.Add(new DataField(globalFieldIterator.Current, Resolver, true));
                    }
                }
            }
            foreach (DataField field in page.Fields)
            	ConfigureDataField(page, field);
        }
        
        private SelectClauseDictionary ParseSelectExpressions(string selectClause)
        {
            SelectClauseDictionary expressions = new SelectClauseDictionary();
            Match fieldMatch = SelectExpressionRegex.Match(selectClause);
            while (fieldMatch.Success)
            {
                string expression = fieldMatch.Groups["Expression"].Value;
                string fieldName = fieldMatch.Groups["FieldName"].Value;
                string alias = fieldMatch.Groups["Alias"].Value;
                if (!(String.IsNullOrEmpty(expression)))
                {
                    if (String.IsNullOrEmpty(alias))
                    	if (String.IsNullOrEmpty(fieldName))
                        	alias = expression;
                        else
                        	alias = fieldName;
                    if (!(expressions.ContainsKey(alias)))
                    	expressions.Add(alias, expression);
                }
                fieldMatch = fieldMatch.NextMatch();
            }
            return expressions;
        }
        
        protected void PopulatePageFields(ViewPage page)
        {
            if (page.Fields.Count > 0)
            	return;
            XPathNodeIterator dataFieldIterator = _view.Select(".//c:dataFields/c:dataField", Resolver);
            while (dataFieldIterator.MoveNext())
            {
                XPathNodeIterator fieldIterator = _config.Select("/c:dataController/c:fields/c:field[@name=\'{0}\']", dataFieldIterator.Current.GetAttribute("fieldName", String.Empty));
                if (fieldIterator.MoveNext())
                {
                    DataField field = new DataField(fieldIterator.Current, Resolver);
                    field.Hidden = (dataFieldIterator.Current.GetAttribute("hidden", String.Empty) == "true");
                    field.DataFormatString = fieldIterator.Current.GetAttribute("dataFormatString", String.Empty);
                    string formatOnClient = dataFieldIterator.Current.GetAttribute("formatOnClient", String.Empty);
                    if (!(String.IsNullOrEmpty(formatOnClient)))
                    	field.FormatOnClient = formatOnClient != "false";
                    if (String.IsNullOrEmpty(field.DataFormatString))
                    	field.DataFormatString = dataFieldIterator.Current.GetAttribute("dataFormatString", String.Empty);
                    field.HeaderText = ((string)(dataFieldIterator.Current.Evaluate("string(c:headerText)", Resolver)));
                    field.FooterText = ((string)(dataFieldIterator.Current.Evaluate("string(c:footerText)", Resolver)));
                    field.ToolTip = dataFieldIterator.Current.GetAttribute("toolTip", String.Empty);
                    field.Watermark = dataFieldIterator.Current.GetAttribute("watermark", String.Empty);
                    field.HyperlinkFormatString = dataFieldIterator.Current.GetAttribute("hyperlinkFormatString", String.Empty);
                    field.AliasName = dataFieldIterator.Current.GetAttribute("aliasFieldName", String.Empty);
                    field.Tag = dataFieldIterator.Current.GetAttribute("tag", String.Empty);
                    if (!(String.IsNullOrEmpty(dataFieldIterator.Current.GetAttribute("allowQBE", String.Empty))))
                    	field.AllowQBE = (dataFieldIterator.Current.GetAttribute("allowQBE", String.Empty) == "true");
                    if (!(String.IsNullOrEmpty(dataFieldIterator.Current.GetAttribute("allowSorting", String.Empty))))
                    	field.AllowSorting = (dataFieldIterator.Current.GetAttribute("allowSorting", String.Empty) == "true");
                    field.CategoryIndex = Convert.ToInt32(dataFieldIterator.Current.Evaluate("count(parent::c:dataFields/parent::c:category/preceding-sibling::c:category)", Resolver));
                    string columns = dataFieldIterator.Current.GetAttribute("columns", String.Empty);
                    if (!(String.IsNullOrEmpty(columns)))
                    	field.Columns = Convert.ToInt32(columns);
                    string rows = dataFieldIterator.Current.GetAttribute("rows", String.Empty);
                    if (!(String.IsNullOrEmpty(rows)))
                    	field.Rows = Convert.ToInt32(rows);
                    string textMode = dataFieldIterator.Current.GetAttribute("textMode", String.Empty);
                    if (!(String.IsNullOrEmpty(textMode)))
                    	field.TextMode = ((TextInputMode)(TypeDescriptor.GetConverter(typeof(TextInputMode)).ConvertFromString(textMode)));
                    string maskType = fieldIterator.Current.GetAttribute("maskType", String.Empty);
                    if (!(String.IsNullOrEmpty(maskType)))
                    	field.MaskType = ((DataFieldMaskType)(TypeDescriptor.GetConverter(typeof(DataFieldMaskType)).ConvertFromString(maskType)));
                    field.Mask = fieldIterator.Current.GetAttribute("mask", String.Empty);
                    string readOnly = dataFieldIterator.Current.GetAttribute("readOnly", String.Empty);
                    if (!(String.IsNullOrEmpty(readOnly)))
                    	field.ReadOnly = (readOnly == "true");
                    string aggregate = dataFieldIterator.Current.GetAttribute("aggregate", String.Empty);
                    if (!(String.IsNullOrEmpty(aggregate)))
                    	field.Aggregate = ((DataFieldAggregate)(TypeDescriptor.GetConverter(typeof(DataFieldAggregate)).ConvertFromString(aggregate)));
                    string search = dataFieldIterator.Current.GetAttribute("search", String.Empty);
                    if (!(String.IsNullOrEmpty(search)))
                    	field.Search = ((FieldSearchMode)(TypeDescriptor.GetConverter(typeof(FieldSearchMode)).ConvertFromString(search)));
                    field.SearchOptions = dataFieldIterator.Current.GetAttribute("searchOptions", String.Empty);
                    string prefixLength = dataFieldIterator.Current.GetAttribute("autoCompletePrefixLength", String.Empty);
                    if (!(String.IsNullOrEmpty(prefixLength)))
                    	field.AutoCompletePrefixLength = Convert.ToInt32(prefixLength);
                    XPathNodeIterator itemsIterator = dataFieldIterator.Current.Select("c:items[c:item]", Resolver);
                    if (!(itemsIterator.MoveNext()))
                    {
                        itemsIterator = fieldIterator.Current.Select("c:items", Resolver);
                        if (!(itemsIterator.MoveNext()))
                        	itemsIterator = null;
                    }
                    if (itemsIterator != null)
                    {
                        field.ItemsDataController = itemsIterator.Current.GetAttribute("dataController", String.Empty);
                        field.ItemsDataView = itemsIterator.Current.GetAttribute("dataView", String.Empty);
                        field.ItemsDataValueField = itemsIterator.Current.GetAttribute("dataValueField", String.Empty);
                        field.ItemsDataTextField = itemsIterator.Current.GetAttribute("dataTextField", String.Empty);
                        field.ItemsStyle = itemsIterator.Current.GetAttribute("style", String.Empty);
                        field.ItemsNewDataView = itemsIterator.Current.GetAttribute("newDataView", String.Empty);
                        field.Copy = itemsIterator.Current.GetAttribute("copy", String.Empty);
                        string pageSize = itemsIterator.Current.GetAttribute("pageSize", String.Empty);
                        if (!(String.IsNullOrEmpty(pageSize)))
                        	field.ItemsPageSize = Convert.ToInt32(pageSize);
                        field.ItemsLetters = (itemsIterator.Current.GetAttribute("letters", String.Empty) == "true");
                        XPathNodeIterator itemIterator = itemsIterator.Current.Select("c:item", Resolver);
                        while (itemIterator.MoveNext())
                        {
                            string itemValue = itemIterator.Current.GetAttribute("value", String.Empty);
                            if (itemValue == "NULL")
                            	itemValue = String.Empty;
                            string itemText = itemIterator.Current.GetAttribute("text", String.Empty);
                            field.Items.Add(new object[] {
                                        itemValue,
                                        itemText});
                        }
                        if (!(String.IsNullOrEmpty(field.ItemsNewDataView)))
                        {
                            Controller itemsController = ((Controller)(this.GetType().Assembly.CreateInstance(this.GetType().FullName)));
                            itemsController.SelectView(field.ItemsDataController, field.ItemsNewDataView);
                            string roles = ((string)(itemsController._config.Evaluate("string(//c:action[@commandName=\'New\' and @commandArgument=\'{0}\'][1]/@roles)", field.ItemsNewDataView)));
                            if (!(Controller.UserIsInRole(roles)))
                            	field.ItemsNewDataView = null;
                        }
                        field.AutoSelect = (itemsIterator.Current.GetAttribute("autoSelect", String.Empty) == "true");
                        field.SearchOnStart = (itemsIterator.Current.GetAttribute("searchOnStart", String.Empty) == "true");
                        field.ItemsDescription = itemsIterator.Current.GetAttribute("description", String.Empty);
                    }
                    if (!(Controller.UserIsInRole(fieldIterator.Current.GetAttribute("writeRoles", String.Empty))))
                    	field.ReadOnly = true;
                    if (!(Controller.UserIsInRole(fieldIterator.Current.GetAttribute("roles", String.Empty))))
                    {
                        field.ReadOnly = true;
                        field.Hidden = true;
                    }
                    page.Fields.Add(field);
                }
            }
        }
        
        protected virtual void ConfigureDataField(ViewPage page, DataField field)
        {
        }
        
        public static string LookupText(string controllerName, string filterExpression, string fieldNames)
        {
            string[] dataTextFields = fieldNames.Split(',');
            PageRequest request = new PageRequest(-1, 1, null, new string[] {
                        filterExpression});
            ViewPage page = ControllerFactory.CreateDataController().GetPage(controllerName, String.Empty, request);
            string result = String.Empty;
            if (page.Rows.Count > 0)
            	for (int i = 0; (i < page.Fields.Count); i++)
                {
                    DataField field = page.Fields[i];
                    if (Array.IndexOf(dataTextFields, field.Name) >= 0)
                    {
                        if (result.Length > 0)
                        	result = (result + "; ");
                        result = (result + Convert.ToString(page.Rows[0][i]));
                    }
                }
            return result;
        }
        
        public static string ConvertSampleToQuery(string sample)
        {
            Match m = Regex.Match(sample, "^\\s*(?\'Operation\'(<|>)={0,1}){0,1}\\s*(?\'Value\'.+)\\s*$");
            if (!(m.Success))
            	return null;
            string operation = m.Groups["Operation"].Value;
            sample = m.Groups["Value"].Value.Trim();
            if (String.IsNullOrEmpty(operation))
            {
                operation = "*";
                double doubleTest;
                if (Double.TryParse(sample, out doubleTest))
                	operation = "=";
                else
                {
                    bool boolTest;
                    if (Boolean.TryParse(sample, out boolTest))
                    	operation = "=";
                    else
                    {
                        DateTime dateTest;
                        if (DateTime.TryParse(sample, out dateTest))
                        	operation = "=";
                    }
                }
            }
            return String.Format("{0}{1}{2}", operation, sample, Convert.ToChar(0));
        }
        
        public static string LookupActionArgument(string controllerName, string commandName)
        {
            Controller c = new Controller();
            c.SelectView(controllerName, null);
            XPathNavigator action = c._config.SelectSingleNode("//c:action[@commandName=\'{0}\' and contains(@commandArgument, \'Form\')]", commandName);
            if (action == null)
            	return null;
            if (!(UserIsInRole(action.GetAttribute("roles", String.Empty))))
            	return null;
            return action.GetAttribute("commandArgument", String.Empty);
        }
        
        public static string CreateReportInstance(Type t, string name, string controller, string view)
        {
            return CreateReportInstance(t, name, controller, view, true);
        }
        
        public static string CreateReportInstance(Type t, string name, string controller, string view, bool validate)
        {
            if (String.IsNullOrEmpty(name))
            {
                string instance = CreateReportInstance(t, String.Format("{0}_{1}.rdlc", controller, view), controller, view, false);
                if (!(String.IsNullOrEmpty(instance)))
                	return instance;
                instance = CreateReportInstance(t, "CustomTemplate.xslt", controller, view, false);
                if (!(String.IsNullOrEmpty(instance)))
                	return instance;
                name = "Template.xslt";
            }
            bool isGeneric = (Path.GetExtension(name).ToLower() == ".xslt");
            string reportKey = ("Report_" + name);
            if (isGeneric)
            	reportKey = String.Format("Reports_{0}_{1}", controller, view);
            string report = null;
            // try loading a report as a resource or from the folder ~/Reports/
            if (t == null)
            	t = typeof(TimeNAction.Data.Controller);
            Stream res = t.Assembly.GetManifestResourceStream(String.Format("TimeNAction.Reports.{0}", name));
            if (res == null)
            	res = t.Assembly.GetManifestResourceStream(String.Format("TimeNAction.{0}", name));
            if (res == null)
            {
                string templatePath = Path.Combine(Path.Combine(HttpRuntime.AppDomainAppPath, "Reports"), name);
                if (!(File.Exists(templatePath)))
                	if (validate)
                    	throw new Exception(String.Format("Report or report template \\\'{0}\\\' does not exist.", name));
                    else
                    	return null;
                report = File.ReadAllText(templatePath);
            }
            else
            {
                StreamReader reader = new StreamReader(res);
                report = reader.ReadToEnd();
                reader.Close();
            }
            if (isGeneric)
            {
                // transform a data controller into a report by applying the specified template
                ControllerConfiguration config = TimeNAction.Data.Controller.CreateConfigurationInstance(t, controller);
                XsltArgumentList arguments = new XsltArgumentList();
                arguments.AddParam("ViewName", String.Empty, view);
                XslCompiledTransform transform = new XslCompiledTransform();
                transform.Load(new XPathDocument(new StringReader(report)));
                MemoryStream output = new MemoryStream();
                transform.Transform(config.TrimmedNavigator, arguments, output);
                output.Position = 0;
                StreamReader sr = new StreamReader(output);
                report = sr.ReadToEnd();
                sr.Close();
            }
            report = Regex.Replace(report, "(<Language>)(.+?)(</Language>)", String.Format("$1{0}$3", System.Threading.Thread.CurrentThread.CurrentUICulture.Name));
            report = Localizer.Replace("Reports", name, report);
            return report;
        }
        
        public static object FindSelectedValueByTag(string tag)
        {
#pragma warning disable 0618
            System.Web.Script.Serialization.JavaScriptSerializer serializer = new System.Web.Script.Serialization.JavaScriptSerializer();
#pragma warning restore 0618
            object[] selectedValues = serializer.Deserialize<object[]>(HttpContext.Current.Request.Form["__WEB_DATAVIEWSTATE"]);
            if (selectedValues != null)
            {
                int i = 0;
                while (i < selectedValues.Length)
                {
                    string k = ((string)(selectedValues[i]));
                    i++;
                    if (k == tag)
                    {
                        object[] v = ((object[])(selectedValues[i]));
                        if ((v == null) || (v.Length == 0))
                        	return null;
                        if (v.Length == 1)
                        	return v[0];
                        return v;
                    }
                    i++;
                }
            }
            return null;
        }
    }
}

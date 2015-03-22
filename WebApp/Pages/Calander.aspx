<%@ Page Language="C#" MasterPageFile="~/Main.Master" AutoEventWireup="true" CodeBehind="Calander.aspx.cs" Inherits="Pages_Calander"  Title="Calander" %>
<%@ Register Src="../Controls/Calander_Ajax.ascx" TagName="Calander_Ajax"  TagPrefix="uc" %>
<asp:Content ID="Content1" ContentPlaceHolderID="PageTitleContentPlaceHolder" runat="Server">Calander</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="PageContentPlaceHolder" runat="Server">
  <div data-flow="NewRow" data-width="100%"><uc:Calander_Ajax ID="control1" runat="server"></uc:Calander_Ajax></div>
</asp:Content>
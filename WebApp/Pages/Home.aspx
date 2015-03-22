<%@ Page Language="C#" MasterPageFile="~/Main.Master" AutoEventWireup="true" CodeBehind="Home.aspx.cs" Inherits="Pages_Home"  Title="^HomeTitle^Start^HomeTitle^" %>
<%@ Register Src="../Controls/TableOfContents.ascx" TagName="TableOfContents"  TagPrefix="uc" %>
<%@ Register Src="../Controls/Welcome.ascx" TagName="Welcome"  TagPrefix="uc" %>
<asp:Content ID="Content1" ContentPlaceHolderID="PageTitleContentPlaceHolder" runat="Server">^HomeTitle^Start^HomeTitle^</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="PageContentPlaceHolder" runat="Server">
  <div data-flow="NewRow"><uc:TableOfContents ID="control1" runat="server"></uc:TableOfContents></div>
  <div data-flow="NewColumn"><uc:Welcome ID="control2" runat="server"></uc:Welcome></div>
</asp:Content>
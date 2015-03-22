<%@ Page Language="C#" MasterPageFile="~/Main.Master" AutoEventWireup="true" CodeBehind="cal.aspx.cs" Inherits="Pages_cal"  Title="cal" %>
<%@ Register Src="../Controls/Calender.ascx" TagName="Calender"  TagPrefix="uc" %>
<asp:Content ID="Content1" ContentPlaceHolderID="PageTitleContentPlaceHolder" runat="Server">cal</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="PageContentPlaceHolder" runat="Server">
  <div data-flow="NewRow" data-width="100%"><uc:Calender ID="control1" runat="server"></uc:Calender></div>
</asp:Content>
<%@ Page Language="C#" AutoEventWireup="true"  %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head runat="server">
    <title>Sandbox</title>
    <script runat="server">
protected void Page_Load(object sender, EventArgs e)
{
    Extender1.Controller = ControllerDropDown.SelectedValue;
}
</script>
  </head>
  <body style="margin:0px;">
    <form id="form1" runat="server">
      <div style="padding:8px">
        <asp:ScriptManager ID="sm" runat="server" ScriptMode="Release" />
        <asp:DropDownList ID="ControllerDropDown" runat="server" AutoPostBack="true" Font-Names="Tahoma" Style="margin-bottom: 8px" Font-Size="8.5pt">
          <asp:ListItem Text="KeyDescription" Value="KeyDescription" />
          <asp:ListItem Text="KeyProcess" Value="KeyProcess" Selected="true" />
          <asp:ListItem Text="TimeNActinCalander" Value="TimeNActinCalander" />
        </asp:DropDownList>
        <div id="Div1" runat="server" />
        <aquarium:DataViewExtender ID="Extender1" runat="server" TargetControlID="Div1" />
      </div>
    </form>
  </body>
</html>
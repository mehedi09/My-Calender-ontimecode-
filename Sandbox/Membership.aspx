<%@ Page Language="C#" AutoEventWireup="true"  %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head runat="server">
    <title>Membership Manager</title>
  </head>
  <body style="margin:0px;">
    <form id="form1" runat="server">
      <div style="padding:8px;">
        <asp:ScriptManager ID="sm" runat="server" ScriptMode="Release" />
        <aquarium:MembershipBar id="mb" runat="server" />
        <div style="padding: 12px 0px 12px 0px">
          <div style="margin-bottom: 12px;">
                Two standard user accounts are <b title="User Name: user">user</b> / <b title="Password: user123%">
                  user123%
                </b> and <b title="User Name: admin">admin</b> / <b title="Password: admin123%">
                  admin123%
                </b>.
              </div>
          <a href="Default.aspx">Controllers</a> | <span style="font-weight: bold;">Membership</span>
        </div>
        <aquarium:MembershipManager id="mm" runat="server" />
      </div>
    </form>
  </body>
</html>
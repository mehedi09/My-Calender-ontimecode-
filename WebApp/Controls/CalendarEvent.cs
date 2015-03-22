using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;
/// <summary>
/// Summary description for CalendarEvent
/// </summary>
namespace WebApp.Controls
{
   public class CalendarEvent
    {
        public int id { get; set; }
        public string title { get; set; }
        public string description { get; set; }
        public DateTime start { get; set; }
        public DateTime end { get; set; }

    }
}


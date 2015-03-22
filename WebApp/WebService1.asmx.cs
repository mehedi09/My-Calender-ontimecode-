using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Services;
using WebApp.Controls;

namespace WebApp
{
    /// <summary>
    /// Summary description for WebService1
    /// </summary>
    [WebService(Namespace = "http://tempuri.org/")]
    [WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
    [System.ComponentModel.ToolboxItem(false)]
    // To allow this Web Service to be called from script, using ASP.NET AJAX, uncomment the following line. 
     [System.Web.Script.Services.ScriptService]
    public class WebService1 : System.Web.Services.WebService
    {

        [WebMethod]
        public string HelloWorld()
        {
            return "Hello World";
        }
        [WebMethod(EnableSession = true)]
        public  int addEvent(string title,string description, string start, string end)
        {
            ImproperCalendarEvent improperEvent=new ImproperCalendarEvent();
            improperEvent.start = start;
            improperEvent.end = end;
            improperEvent.title = title;
            improperEvent.description = description;
           // string dt = Convert.ToDateTime(improperEvent.start).ToString("yyyy-MM-dd hh:mm:ss");
            //string dt1 = Convert.ToDateTime(improperEvent.end).ToString("yyyy-MM-dd hh:mm:ss");
            CalendarEvent cevent = new CalendarEvent()
            {
                title = improperEvent.title,
                description = improperEvent.description,
                start = DateTime.ParseExact(improperEvent.start, "dd-MM-yyyy hh:mm:ss tt", CultureInfo.InvariantCulture),
                end = DateTime.ParseExact(improperEvent.end, "dd-MM-yyyy hh:mm:ss tt", CultureInfo.InvariantCulture)


                // DateTime.ParseExact(improperEvent.start, "dd-MM-yyyy hh:mm:ss tt", CultureInfo.InvariantCulture),
                 //   DateTime.ParseExact(improperEvent.end, "dd-MM-yyyy hh:mm:ss tt", CultureInfo.InvariantCulture));

            };

            if (CheckAlphaNumeric(cevent.title) && CheckAlphaNumeric(cevent.description))
            {
                int key = EventDAO.addEvent(cevent);// addEvent(cevent);

                List<int> idList = (List<int>)System.Web.HttpContext.Current.Session["idList"];

                if (idList != null)
                {
                    idList.Add(key);
                }

                return key;//return the primary key of the added cevent object

            }

            return -1;//return a negative number just to signify nothing has been added

        }

        [WebMethod(EnableSession = true)]
        public  string UpdateEvent(int id, string title, string description)
        {
            CalendarEvent cevent = new CalendarEvent();
            cevent.id = id;
            cevent.title = title;
            cevent.description = description;
            List<int> idList = (List<int>)System.Web.HttpContext.Current.Session["idList"];
            if (idList != null && idList.Contains(cevent.id))
            {
                if (CheckAlphaNumeric(cevent.title) && CheckAlphaNumeric(cevent.description))
                {
                    EventDAO.updateEvent(cevent.id, cevent.title, cevent.description);

                    return "updated event with id:" + cevent.id + " update title to: " + cevent.title +
                    " update description to: " + cevent.description;
                }

            }

            return "unable to update event with id:" + cevent.id + " title : " + cevent.title +
                " description : " + cevent.description;
        }

        //this method only updates start and end time
        //this is called when a event is dragged or resized in the calendar
        [WebMethod(EnableSession = true)]
        public  string UpdateEventTime(int id, string start, string end)
        {
            ImproperCalendarEvent improperEvent = new ImproperCalendarEvent();
            improperEvent.id = id;
            improperEvent.start = start;
            improperEvent.end = end;
            List<int> idList = (List<int>)System.Web.HttpContext.Current.Session["idList"];
            if (idList != null && idList.Contains(improperEvent.id))
            {
                EventDAO.updateEventTime(improperEvent.id,
                    DateTime.ParseExact(improperEvent.start, "dd-MM-yyyy hh:mm:ss tt", CultureInfo.InvariantCulture),
                    DateTime.ParseExact(improperEvent.end, "dd-MM-yyyy hh:mm:ss tt", CultureInfo.InvariantCulture));

                return "updated event with id:" + improperEvent.id + "update start to: " + improperEvent.start +
                    " update end to: " + improperEvent.end;
            }

            return "unable to update event with id: " + improperEvent.id;
        }

        //called when delete button is pressed
        [WebMethod(EnableSession = true)]
        public  String deleteEvent(int id)
        {
            //idList is stored in Session by JsonResponse.ashx for security reasons
            //whenever any event is update or deleted, the event id is checked
            //whether it is present in the idList, if it is not present in the idList
            //then it may be a malicious user trying to delete someone elses events
            //thus this checking prevents misuse
            List<int> idList = (List<int>)System.Web.HttpContext.Current.Session["idList"];
            if (idList != null && idList.Contains(id))
            {
                EventDAO.deleteEvent(id);
                return "deleted event with id:" + id;
            }

            return "unable to delete event with id: " + id;

        }
        private static bool CheckAlphaNumeric(string str)
        {

            return Regex.IsMatch(str, @"^[a-zA-Z0-9 ]*$");


        }
    }
}

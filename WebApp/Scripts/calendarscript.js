var currentUpdateEvent;
var addStartDate;
var addEndDate;
var globalAllDay;

function updateEvent(event, element) {
    //alert(event.description);

    if ($(this).data("qtip")) $(this).qtip("destroy");

    currentUpdateEvent = event;

    $('#updatedialog').dialog('open');

    $("#eventName").val(event.title);
    $("#eventDesc").val(event.description);
    $("#eventId").val(event.id);
    $("#eventStart").text("" + event.start.toLocaleString());

    if (event.end === null) {
        $("#eventEnd").text("");
    }
    else {
        $("#eventEnd").text("" + event.end.toLocaleString());
    }

}

function updateSuccess(updateResult) {
    $('#updatedialog').dialog('close');
}

function deleteSuccess(deleteResult) {
    //alert(deleteResult);
}

function addSuccess(addResult) {
// if addresult is -1, means event was not added
//    alert("added key: " + addResult);
   // alert(addResult);
    if (addResult != -1) {
        $('#calendar').fullCalendar('renderEvent',
						{
						    title: $("#addEventName").val(),
						    start: addStartDate,
						    end: addEndDate,
						    id: addResult,
						    description: $("#addEventDesc").val(),
						    allDay: globalAllDay
						},
						true // make the event "stick"
					);

        
        $('#addDialog').dialog("close");
        $('#calendar').fullCalendar('unselect');
    }

}

function UpdateTimeSuccess(updateResult) {
    //alert(updateResult);
}


function selectDate(start, end, allDay) {

    $('#addDialog').dialog('open');


    $("#addEventStartDate").text("" + start.toLocaleString());
    $("#addEventEndDate").text("" + end.toLocaleString());


    addStartDate = start;
    addEndDate = end;
    globalAllDay = allDay;
    //alert(allDay);

}

function updateEventOnDropResize(event, allDay) {

    //alert("allday: " + allDay);
    var eventToUpdate = {
        id: event.id,
        start: event.start

    };
    var id = event.id;
    var start = event.start;

    if (allDay) {
        eventToUpdate.start.setHours(0, 0, 0);
        start.setHours(0,0,0);

    }

    if (event.end === null) {
        eventToUpdate.end = eventToUpdate.start;
        end = start;

    }
    else {
        eventToUpdate.end = event.end;
        end = event.end;
        if (allDay) {
            eventToUpdate.end.setHours(0, 0, 0);
            end.setHours(0,0,0);
        }
    }

    eventToUpdate.start = eventToUpdate.start.format("dd-MM-yyyy hh:mm:ss tt");
    eventToUpdate.end = eventToUpdate.end.format("dd-MM-yyyy hh:mm:ss tt");

    start = start.format("dd-MM-yyyy hh:mm:ss tt");
    end = end.format("dd-MM-yyyy hh:mm:ss tt");

    // PageMethods.UpdateEventTime(eventToUpdate, UpdateTimeSuccess);
    $.ajax({
        type: "POST",
        url: "/WebService1.asmx/UpdateEventTime",
        data: '{id: "' + id + '", start: "' + start + '", end: "' + end + '"}',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            //alert(data);
            UpdateTimeSuccess(data);
            // Do something interesting here.

        }
    });

}

function eventDropped(event, dayDelta, minuteDelta, allDay, revertFunc) {

    if ($(this).data("qtip")) $(this).qtip("destroy");

    updateEventOnDropResize(event, allDay);



}

function eventResized(event, dayDelta, minuteDelta, revertFunc) {

    if ($(this).data("qtip")) $(this).qtip("destroy");

    updateEventOnDropResize(event);

}

function checkForSpecialChars(stringToCheck) {
    var pattern = /[^A-Za-z0-9 ]/;
    return pattern.test(stringToCheck); 
}

$(document).ready(function() {

    // update Dialog
    $('#updatedialog').dialog({
        autoOpen: false,
        width: 470,
        buttons: {
            "update": function() {
                //alert(currentUpdateEvent.title);
                var eventToUpdate = {
                    id: currentUpdateEvent.id,
                    title: $("#eventName").val(),
                    description: $("#eventDesc").val()
                };
                var id= currentUpdateEvent.id;
                var title = $("#eventName").val();
                var description = $("#eventDesc").val();
                if (checkForSpecialChars(eventToUpdate.title) || checkForSpecialChars(eventToUpdate.description)) {
                    alert("please enter characters: A to Z, a to z, 0 to 9, spaces");
                }
                else {
                    //PageMethods.UpdateEvent(eventToUpdate, updateSuccess);
                    //$(this).dialog("close");
                    $.ajax({
                        type: "POST",
                        url: "/WebService1.asmx/UpdateEvent",
                        data: '{id: "' + id + '", title: "' + title + '", description: "' + description + '"}',
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        success: function (data) {
                            //alert(data);
                            updateSuccess(data);
                            // Do something interesting here.

                        }
                    });

                    currentUpdateEvent.title = $("#eventName").val();
                    currentUpdateEvent.description = $("#eventDesc").val();
                    $('#calendar').fullCalendar('updateEvent', currentUpdateEvent);
                }

            },
            "delete": function() {

                if (confirm("do you really want to delete this event?")) {
                    $.ajax({
                        type: "POST",
                        url: "/WebService1.asmx/deleteEvent",
                        data: '{id: "' + $("#eventId").val() + '"}',
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        success: function (data) {
                            //alert(data);
                            deleteSuccess(data);
                            // Do something interesting here.

                        }
                    });


                    //PageMethods.deleteEvent($("#eventId").val(), deleteSuccess);
                    $(this).dialog("close");
                    $('#calendar').fullCalendar('removeEvents', $("#eventId").val());
                }

            }

        }
    });

    //add dialog
    $('#addDialog').dialog({
        autoOpen: false,
        width: 470,
        buttons: {
            "Add": function() {
               
                //alert("sent:" + addStartDate.format("dd-MM-yyyy hh:mm:ss tt") + "==" + addStartDate.toLocaleString());
                var eventToAdd = {
                title:$("#addEventName").val(),
                description: $("#addEventDesc").val(),
               start : addStartDate.format("dd-MM-yyyy hh:mm:ss tt"),
               end : addEndDate.format("dd-MM-yyyy hh:mm:ss tt")

                };
               var title = $("#addEventName").val();
               var description = $("#addEventDesc").val();
               var start = addStartDate.format("dd-MM-yyyy hh:mm:ss tt");
               var end = addEndDate.format("dd-MM-yyyy hh:mm:ss tt");
                if (checkForSpecialChars(eventToAdd.title) || checkForSpecialChars(eventToAdd.description)) {
                    alert("Add Function is now running if");
                    alert("please enter characters: A to Z, a to z, 0 to 9, spaces");
                }
                else {
                    //alert("sending " + eventToAdd.title);
                    //alert(addSuccess);
                    //PageMethods.addEvent(eventToAdd, addSuccess);
                    //$(this).dialog("close");
                    $.ajax({
                        type: "POST",
                        url: "/WebService1.asmx/addEvent",
                        data: '{title: "' + title + '", description: "' + description + '", start: "' + start + '", end: "' + end + '"}',
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        success: function (data) {
                            //alert(data);
                            addSuccess(data);
                            // Do something interesting here.
                           
                        }
                    });
                }

            }

        }
    });


    var date = new Date();
    var d = date.getDate();
    var m = date.getMonth();
    var y = date.getFullYear();

    var calendar = $('#calendar').fullCalendar({
        theme: true,
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay'
        },
        eventClick: updateEvent,
        selectable: true,
        selectHelper: true,
        select: selectDate,
        editable: true,
        events: "../Controls/JsonResponse.ashx",
        eventDrop: eventDropped,
        eventResize: eventResized,
        eventRender: function(event, element) {
            //alert(event.title);
            element.qtip({
                content: event.description,
                position: { corner: { tooltip: 'bottomLeft', target: 'topRight'} },
                style: {
                    border: {
                        width: 1,
                        radius: 3,
                        color: '#2779AA'

                    },
                    padding: 10,
                    textAlign: 'center',
                    tip: true, // Give it a speech bubble tip with automatic corner detection
                    name: 'cream' // Style it according to the preset 'cream' style
                }

            });
        }

    });

});


var graphEditorTab = null, algorithmTab = null;
var exerciseTab1 = null;
var exerciseTab2 = null;
function svgHack(){
    //http://www.mediaevent.de/svg-in-html-seiten/
   var imgs = d3.selectAll("img");

//    var sources = imgs[0].map(function(d){return d.src});

   imgs.attr("src",function(a,b,c){
       var src = this.src;
       var selection = d3.select(this);
       if(src.indexOf(".svg")==src.length-4){
           d3.text(src, function(error,text){
            var parent = d3.select(selection.node().parentNode)
                parent.insert("span","img").html(text);
                var newSVGElem = parent.select("span").select("svg");
                newSVGElem.attr("class","svgText");
                selection.remove();
        });
       }
       return src;
   })
}
/**
 * Initializes the page layout of all interactive tabs
 * @author Adrian Haarbach
 * @global
 * @function
 */
function initializeSiteLayout(GraphAlgorithmConstructor) {

    $("button").button();
    $("#te_button_gotoDrawGraph").click(function() { $("#tabs").tabs("option", "active", 1);});
    $("#te_button_gotoIdee").click(function() { $("#tabs").tabs("option", "active", 3);});
    $("#ti_button_gotoDrawGraph").click(function() { $("#tabs").tabs("option", "active", 1);});
    $("#ti_button_gotoAlgorithm").click(function() { $("#tabs").tabs("option", "active", 2);});

    //Gergana
    $("#ta_button_gotoExercise1").click(function() { $("#tabs").tabs("option", "active", 4);});;
    $("#ta_button_gotoIdee").click(function() { $("#tabs").tabs("option", "active", 3);});
    $("#ta_button_gotoExerciseResidualNetwork").click(function() { $("#tabs").tabs("option", "active", 5);});
    $("#ta_button_gotoId").click(function() { $("#tabs").tabs("option", "active", 3);});

	
   $("#ti_button_gotoExercise1").click(function() { $("#tabs").tabs("option", "active", 4);});;
    $("#ti_button_gotoExerciseResidualNetwork").click(function() { $("#tabs").tabs("option", "active", 5);});


    $("#tw_Accordion").accordion({heightStyle: "content"});


    graphEditorTab = new GraphEditorTab(new GraphEditor(d3.select("#tg_canvas_graph")),$("#tab_tg"));
    graphEditorTab.init();

    var algo = new GraphAlgorithmConstructor(d3.select("#ta_canvas_graph"));
    algorithmTab = new AlgorithmTab(algo, $("#tab_ta"));
    $("#tab_ta").data("algo", algo);
    algorithmTab.init();

    var exercise = new Exercise1(d3.select("#tf1_canvas_graph"));
    exerciseTab1 = new ExerciseTab1(exercise, $("#tab_tf1"));
    $("#tab_tf1").data("algo", exercise);
    exerciseTab1.init();
	
	var exercise2 = new Exercise2(d3.select("#tf2_canvas_graph"));
    exerciseTab2 = new ExerciseTab2(exercise2, $("#tab_tf2"));
    $("#tab_tf2").data("algo", exercise2);
    exerciseTab2.init();


    $("#tabs").tabs({
        beforeActivate: function(event, ui) {
            var id = ui.oldPanel[0].id;
            if(id == "tab_tg") { /** graph editor tab */
                //graphEditorTab.deactivate();
            }else if(id == "tab_ta") { /** graph algorithm tab */
              if($("#tabs").data("tabChangeDialogOpen") == null && $("#tab_ta").data("algo").getWarnBeforeLeave()) {
                  event.preventDefault();
                  $( "#tabs" ).data("requestedTab",$("#" +ui.newPanel.attr("id")).index()-1);
                  $("#tabs").data("tabChangeDialogOpen",true);
                  $( "#ta_div_confirmTabChange").dialog("open");
              }
              else {
                  $("#tab_ta").data("algo").deactivate();
              }
              // algorithmTab.deactivate();

            }else if(id == "tab_tf1") { 
              if($("#tabs").data("tabChangeDialogOpen") == null && $("#tab_tf1").data("algo").getWarnBeforeLeave()) {
                  event.preventDefault();
                  $( "#tabs" ).data("requestedTab",$("#" +ui.newPanel.attr("id")).index()-1);
				  $("#tabs").data("tabIntroDialog",true);
				  $( "#tf1_div_tabIntroDialog" ).dialog("open");
                  $("#tabs").data("tabChangeDialogOpen",true);
                  $( "#tf1_div_confirmTabChange" ).dialog("open");
              }
              else {
                  $("#tab_tf1").data("algo").deactivate();
              }
              // exerciseTab1.deactivate();

            }else if(id == "tab_tf2") { 
			console.log("deactivate tab_tf1");
              if($("#tabs").data("tabChangeDialogOpen") == null) {
                  event.preventDefault();
                  $( "#tabs" ).data("requestedTab",$("#" +ui.newPanel.attr("id")).index()-1);
				  $("#tabs").data("tabIntroDialog",true);
				  $( "#tf2_div_tabIntroDialog" ).dialog("open");
                  $("#tabs").data("tabChangeDialogOpen",true);
                  $( "#tf2_div_confirmTabChange" ).dialog("open");
              }
              else {
                  $("#tab_tf2").data("algo").deactivate();
              }
              // exerciseTab1.deactivate();

            }
        },
        activate: function(event, ui) {
            var id = ui.newPanel[0].id;

            if(id == "tab_tg") {
              console.log("activate tab_tg");
                graphEditorTab.activate();
            } else if(id == "tab_ta") {
              console.log("activate tab_ta");
                algorithmTab.activate();
            }else if(id == "tab_tf1"){
              console.log("activate tab_tf1");
              exerciseTab1.activate();
			  $( "#tf1_div_TabIntroDialog" ).dialog("open");
              $( "#tf1_div_TabIntroDialog" ).data("wasOpen", true)
			}else if(id == "tab_tf2"){	
              console.log("activate tab_tf2");
              exerciseTab2.activate();
				//if (! $( "#tf1_div_TabIntroDialog" ).data("wasOpen")) {
                  $( "#tf2_div_TabIntroDialog" ).dialog("open");
                   $( "#tf2_div_TabIntroDialog" ).data("wasOpen", true)
				//}
            }
        }
    });

   svgHack();
   svgGraphCanvasDownloadable();
}

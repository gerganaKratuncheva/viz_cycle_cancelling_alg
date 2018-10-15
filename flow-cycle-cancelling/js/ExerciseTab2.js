/**
 * Tab for an exercise
 * initializes the buttons, callbacks, the logger and fast forward funcitonality
 * @author Adrian Haarbach
 * @augments AlgorithmTab
 * @class
 */
function ExerciseTab2(algo, p_tab) {
    Tab.call(this, algo, p_tab);

    /**
     * ID of the fast forward interval
     * @type Number
     */
    algo.fastForwardIntervalID = null;

    var that = this;

    /**
     * Timeout speed in milliseconds for fast forward
     * @type Number
     */
    var fastForwardSpeed = 180;

    /**
     * the logger instance
     * @type Logger
     */
    var logger = new Logger(d3.select("#logger"));


    var fastforwardOptions = {label: $("#tf2_button_text_fastforward").text(), icons: {primary: "ui-icon-seek-next"}};

    /**
     * Initialisiert das Zeichenfeld
     * @method
     */
    this.init = function() {

    //$("#tf2_select_GraphSelector").on("change.Exercise1", that.setGraphHandler);     // Beispielgraph auswählen
    //   if(Graph.instance==null){
    //     //calls registered event listeners when loaded;
    //     var GRAPH_FILENAME = GRAPH_FILENAME || null;
    //     var filename = GRAPH_FILENAME || "graphs-new/"+$("#tf2_select_GraphSelector").val()+".txt"; //the selected option
    //    Graph.loadInstance(filename,function(error,text,filename){
    //        console.log("error loading graph instance "+error + " from " + filename +" text: "+text);
    //    });
    // }
      //$("#tf2_select_GraphSelector").on(that.setGraphHandler);     // Beispielgraph auswählen

      // Graph.instance == null;
      //var GRAPH_FILENAME = GRAPH_FILENAME || null;
       //var filename = GRAPH_FILENAME || "graphs-new/"+$("#tf2_select_GraphSelector").val()+".txt"; //the selected option
      // console.log(filename);
      // Graph.loadInstance(filename,function(error,text,filename){
      //    console.log("error loading graph instance "+error + " from " + filename +" text: "+text);
      //    });
      //


       Graph.addChangeListener(function(){
          algo.clear();
          algo.update();
      });



    //  var pauseOptions = {label: $("#tf2_button_text_pause").text(), icons: {primary: "ui-icon-pause"}};

      // if(algo.rewindStart && algo.rewindStop){
      // var rewindOptions = {label: $("#tf2_button_text_rewind").text(), icons: {primary: "ui-icon-seek-prev"}};
      //     $("#tf2_button_rewind")
      //     .button(rewindOptions)
      //     .click(function() {
      //         $(this).button("option",this.checked ? pauseOptions : rewindOptions);
      //         this.checked ? algo.rewindStart() : algo.rewindStop();
      //     })
      // }else{
      //     $("#tf2_button_rewind").hide();
      //     $("#tf2_button_text_rewind").hide();
      // }
      //
      // $("#tf2_button_Zurueck")
      //     .button({icons: {primary: "ui-icon-seek-start"}})
      //     .click(function() {
      //         algo.previousStepChoice();
      //     });

      $("#tf2_button_1Schritt")
          .button({icons: {primary: "ui-icon-seek-end"}})
          .click(function() {
              algo.nextStepChoice();
          });

      // $("#tf2_button_vorspulen")
      //     .button(fastforwardOptions)
      //     .click(function() {
      //         $(this).button("option",this.checked ? pauseOptions : fastforwardOptions);
      //         this.checked ? that.fastForwardAlgorithm() : that.stopFastForward();
      //     });


      $("#tf2_div_statusTabs").tabs();
      $("#tf2_div_statusTabs").tabs("option", "active", 1);

      $("#tf2_tr_LegendeClickable").removeClass("greyedOutBackground");

      // var sel = d3.select("#tf2_div_statusPseudocode").selectAll("div").selectAll("p")
      // sel.attr("class", function(a, pInDivCounter, divCounter) {
      //     return "pseudocode";
      // });

      Tab.prototype.init.call(this);
      //algo.nextStepChoice();
    };

    // this.activate = function(){
    //
    //
    //   //algo.clear();
    //   if(Graph.instance) {
    //     algo.update();
    //   }
    //   Tab.prototype.activate.call(this);
    //   Graph.setGraph("tf2");
    //
    //
    // };
    //

    // this.activate = function() {
    //
    //   console.log("Haaaallo from activate Ex1");
    //   if(Graph.instance==null){
    //     //calls registered event listeners when loaded;
    //     var GRAPH_FILENAME = GRAPH_FILENAME || null;
    //     var filename = GRAPH_FILENAME || "graphs-new/"+$("#tf2_select_GraphSelector").val()+".txt"; //the selected option
    //    Graph.loadInstance(filename,function(error,text,filename){
    //        console.log("error loading graph instance "+error + " from " + filename +" text: "+text);
    //    });
    // }
    //   // Graph.setGraph("tf2");
    //    if(Graph.instance) algo.update();
    //    Tab.prototype.activate.call(this);
    // };

    /**
     * "Spult vor", führt den Algorithmus mit hoher Geschwindigkeit aus.
     * @method
     */
    this.fastForwardAlgorithm = function() {
       algo.fastForwardIntervalID = window.setInterval(function() {
            algo.nextStepChoice();
        }, fastForwardSpeed);

        algo.update();
    };

    /**
     * Stoppt das automatische Abspielen des Algorithmus
     * @method
     */
    this.stopFastForward = function() {
        window.clearInterval(algo.fastForwardIntervalID);
        algo.fastForwardIntervalID = null;
      //  d3.select("#tf2_button_vorspulen").property("checked",false);
      //  $("#tf2_button_vorspulen").button("option",fastforwardOptions);
        algo.update();
    };


    algo.stopFastForward = this.stopFastForward;
}

this.setGraphHandler = function() {
  console.log("setGraphHandler");

  Graph.setGraph("tf2");
    algo.clear();
    // var selection = $("#tf2_select_GraphSelector>option:selected").val();
    // var filename = selection + ".txt";
    // console.log(filename);
    //
    // Graph.loadInstance("graphs-new/"+filename); //calls registered event listeners when loaded;

//         Graph.load("graphs-new/"+filename, function(graphLoaded){
//             that.setGraph(graphLoaded);
//         });
};


// Vererbung realisieren
ExerciseTab2.prototype = Object.create(Tab.prototype);
ExerciseTab2.prototype.constructor = ExerciseTab2;

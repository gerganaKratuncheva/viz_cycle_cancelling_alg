/**
 * Tab for an exercise
 * initializes the buttons, callbacks, the logger and fast forward funcitonality
 * @author Adrian Haarbach, Gergana Kratuncheva
 * @augments Tab
 * @class
 */
function ExerciseTab1(algo,p_tab) {
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


    var fastforwardOptions = {label: $("#tf1_button_text_fastforward").text(), icons: {primary: "ui-icon-seek-next"}};

    /**
     * Initialisiert das Zeichenfeld
     * @method
     */
     this.init = function() {

         console.log("Haaaallo from init Ex1");

	  
		
        $("#tf1_select_GraphSelector").on("change.GraphDrawer",that.setGraphHandler);     // Beispielgraph auswählen
		console.log("init->setGraphHandler");
		algo.clear();
        Graph.addChangeListener(function(){
			console.log("addChangeListener");
            that.reset();
            algo.clear();
            algo.update();
        });
         this.setGraphHandler(); //triggers loading of first graph



	$('#fileDownloader').on('click',function(foo){
            var ahref = $(this);
            var text = Graph.instance.toString();
            text = "data:text/plain,"+encodeURIComponent(text);
            ahref.prop("href",text);
        });

        $('#tf1_div_parseError').dialog({
            autoOpen: false,
            resizable: false,
    //      modal: true,
            buttons: {
                "Ok": function() {
                    $(this).dialog( "close" );
                }
            }
        });

  


         var pauseOptions = {label: $("#tf1_button_text_pause").text(), icons: {primary: "ui-icon-pause"}};

         if(algo.rewindStart && algo.rewindStop){
         var rewindOptions = {label: $("#tf1_button_text_rewind").text(), icons: {primary: "ui-icon-seek-prev"}};
             $("#tf1_button_rewind")
             .button(rewindOptions)
             .click(function() {
                 $(this).button("option",this.checked ? pauseOptions : rewindOptions);
                 this.checked ? algo.rewindStart() : algo.rewindStop();
             })
         }else{
             $("#tf1_button_rewind").hide();
             $("#tf1_button_text_rewind").hide();
         }

         $("#tf1_button_Zurueck")
             .button({icons: {primary: "ui-icon-seek-start"}})
             .click(function() {
                 algo.previousStepChoice();
             });

         $("#tf1_button_1Schritt")
             .button({icons: {primary: "ui-icon-seek-end"}})
             .click(function() {
                 algo.nextStepChoice();
             });

         $("#tf1_button_vorspulen")
            .button(fastforwardOptions)
            .click(function() {
                $(this).button("option",this.checked ? pauseOptions : fastforwardOptions);
                this.checked ? that.fastForwardAlgorithm() : that.stopFastForward();
            });

			$("#tf1_vorspulen_speed").on("input",function(){
				fastForwardSpeed=+this.value;  
			});

         $("#tf1_div_statusTabs").tabs();
         $("#tf1_div_statusTabs").tabs("option", "active", 2);

         $("#tf1_tr_LegendeClickable").removeClass("greyedOutBackground");

         var sel = d3.select("#tf1_div_statusPseudocode").selectAll("div").selectAll("p")
         sel.attr("class", function(a, pInDivCounter, divCounter) {
             return "pseudocode";
         });

         Tab.prototype.init.call(this);
         //algo.nextStepChoice();
       };



      // this.activate = function() {
      //
      //     console.log("Haaaallo from activate Ex1");
      //     if(Graph.instance==null){
      //       //calls registered event listeners when loaded;
      //       var GRAPH_FILENAME = GRAPH_FILENAME || null;
      //       var filename = GRAPH_FILENAME || "graphs-new/"+$("#tf1_select_GraphSelector").val()+".txt"; //the selected option
      //      Graph.loadInstance(filename,function(error,text,filename){
      //          console.log("error loading graph instance "+error + " from " + filename +" text: "+text);
      //      });
      //   }
      //     // Graph.setGraph("tf1");
      //      if(Graph.instance) algo.update();
      //      Tab.prototype.activate.call(this);
      //   };
	  
	  /**
     * When Tab comes into view we update the view
     * @method
     */
    //this.activate = function() {
     //  Graph.setGraph("tf1");  
     //  if(Graph.instance) algo.update();
     //  Tab.prototype.activate.call(this);
    //};
    
	/**
     * A different example graph was selected. Triggers the loader
     * @method
     */
    this.setGraphHandler = function() {
		console.log("graphHandler");
		
        var selection = $("#tf1_select_GraphSelector>option:selected").val();
        var filename = selection + ".txt";
        console.log(filename);

        Graph.loadInstance("graphs-new/"+filename); //calls registered event listeners when loaded;
    };
	
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
        d3.select("#tf1_button_vorspulen").property("checked",false);
        $("#tf1_button_vorspulen").button("option",fastforwardOptions);
        algo.update();
    };


    algo.stopFastForward = this.stopFastForward;
}

// Vererbung realisieren
ExerciseTab1.prototype = Object.create(Tab.prototype);
ExerciseTab1.prototype.constructor = ExerciseTab1;

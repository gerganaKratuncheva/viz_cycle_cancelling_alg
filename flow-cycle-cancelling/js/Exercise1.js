/**
 * @author Gergana Kratuncheva
 * Code fuer Forschungsaufgabe 1<br>
 * Basiert auf dem Code für den normalen Algorithmus
 */
/**
 * Instanz der Forschungsaufgabe 1
 * @constructor
 * @param {BipartiteGraph} p_graph Graph, auf dem der Algorithmus ausgeführt wird
 * @param {Object} p_canvas jQuery Objekt des Canvas, in dem gezeichnet wird.
 * @param {Object} p_tab jQuery Objekt des aktuellen Tabs.
 * @augments GraphDrawer
 */
function Exercise1(svgSelection) {
    GraphDrawer.call(this, svgSelection, null, null, "tf1");

	var svgOrigin = d3.select("body")
        .select("svg");
    var svg = d3.select("#tf1_canvas_graph");
    

    //insert markers
    var definitions = svgSelection.append("defs")
        .attr("id", "line-markers");

    definitions.append("marker")
        .attr("id", "flow-arrow2")
        .attr("refX", 12) /*must be smarter way to calculate shift*/
        .attr("refY", 2)
        .attr("markerWidth", 12)
        .attr("markerHeight", 4)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M 0,0 V 4 L6,2 Z")
        .attr("fill", const_Colors.NormalEdgeColor); //this is actual shape for arrowhead

    definitions.append("marker")
        .attr("id", "residual-forward2")
        .attr("refX", 14) /*must be smarter way to calculate shift*/
        .attr("refY", 3)
        .attr("markerWidth", 14)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M 2,3 L0,6 L8,3 Z")
        .attr("fill", const_Colors.NormalEdgeColor); //this is actual shape for arrowhead

    definitions.append("marker")
        .attr("id", "residual-backward2")
        .attr("refX", 0) /*must be smarter way to calculate shift*/
        .attr("refY", 3)
        .attr("markerWidth", 14)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M 6,3 L12,3 L14,0 Z")
        .attr("fill", const_Colors.NormalEdgeColor); //this is actual shape for arrowhead



    /**
     * Closure Variable für dieses Objekt
     * @type Forschungsaufgabe1
     */
    var that = this;
    var algo = that;

    var currentFlow = 0;
    var minCost = 0;
    var debugConsole = true;
    /**
     * Parameter der aktuellen Frage (wird dann für die Antwort verwendet)<br>
     * frageKnoten: Knoten, zu dem die Frage gestellt wurde<br>
     * Antwort : String der richtigen Antwort<br>
     * AntwortGrund: Begründung der richtigen Antwort<br>
     * newNodeLabel: Label den der Knoten nach der richtigen Beantwortung bekommt (neuer Abstandswert)<br>
     * gewusst: Ob die Antwort bereits beim ersten Versuch korrekt gegeben wurd<br>
     * @type Object
     */
    this.frageParam = new Object();

    /**
     * Statistiken zu den Fragen
     * @type Object
     */
    var frageStats = {
        richtig: 0,
        falsch: 0,
        gestellt: 0
    };

    /**
     * Status der Frage.<br>
     * Keys: aktiv, warAktiv
     * Values: Boolean
     * @type Object
     */
    var frageStatus = new Object();

    /**
     * Welcher Tab (Erklärung oder Pseudocode) angezeigt wurde, bevor die Frage kam.
     * Dieser Tag wird nach der Frage wieder eingeblendet.
     * @type Boolean
     */
    var tabVorFrage = null;


    /**
     *  Die nextStepChoice Methode der Oberklasse
     *  @type method
     */
    this.algoNext = this.nextStepChoice;

    /**
     *  Die minimale Anzahl von Fragen
     *  @type Number
     */
    var min_questions = 3;

    /**
     *  Die maximale Anzahl von Fragen
     *  @type Number
     */
    var max_questions = 8;
	
	
	var counter = 0;
	
	
	/**
	*   The graph that was used the last time for this exercise
	*/
	var oldGraph = 0;
	
	/**
	*   A random chosen graph that will be used this time in 
	*   exercise (and will NOT be the same as the last time)
	*/
	var randomGraph = 0;

    /*
     * Hier werden die Statuskonstanten definiert
     * */
	var STEP_BEGINALGORITHM = "begin-algorithm";
    var STEP_SELECTSOURCE = "select-source";
    var STEP_SELECTTARGET = "select-target";
    var STEP_START = "start-algorithm";
    var STEP_GETMAXFLOW = "get-max-flow";
    var STEP_MAINLOOP = "main-loop";
    var STEP_FINDNEGATIVECYCLE = "find-neg-cycle";
    var STEP_ADJUSTCYCLE = "adjust-cycle";
    var STEP_FINISHED = "finished";


    /**
     * status variables
     * @type Object
     */
    var state = {

        current_step: STEP_BEGINALGORITHM, //status id
        sourceId: -1,
        targetId: -1,
        cycle_min_flow: 0,
        cycle: [],
        cycle1: [],
        currentCost: 0

    };

    /**
     * the logger instance
     * @type Logger
     */
    var logger = new Logger(d3.select("#logger"));

    var colormap = ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837"].reverse();

    function flowWidth(val) {
        var maxCap = d3.max(Graph.instance.getEdges(), function(d) {
            return d.resources[0]
        });
        return 25 * (val / maxCap);
    }

    this.flowWidth = flowWidth;

    this.nodeLabel = function(d) {
        if(d.id == state.sourceId)
            return "s";
        else if(d.id == state.targetId)
            return "t";
        else
            return d.id;
    }

  
    this.nodeText = "";

    this.edgeText = function(d) {
        if(!state.show_residual_graph)
            return "(" + d.state.flow + "/" + d.resources[0] + "," + d.resources[1] + ")";
        else {
            if(d.state.flow < d.resources[0])
                return "(" + d.state.flow + ", " + d.resources[1] + ")";
            else
                return "";
        }
    }

    this.edgeTextBelow =
        function(d) {
            if(state.show_residual_graph && d.state.flow > 0)
                return "(" + d.state.flow + ", " + -d.resources[1] + ")";
            else
                return "";
        }

    this.onNodesEntered = function(selection) {
        //select source and target nodes
        selection
            .on("click", function(d) {
                if(state.current_step == STEP_SELECTSOURCE ||
                    (state.current_step == STEP_SELECTTARGET && d.id != state.sourceId)) {
                    that.nextStepChoice(d);
                }
            })
    }

    this.onNodesUpdated = function(selection) {
        selection
            .selectAll("circle")
            .style("fill", function(d) {
                if(d.id == state.sourceId)
                    return const_Colors.StartNodeColor; //green
                else if(d.id == state.targetId)
                    return const_Colors.RedText; //NodeFillingQuestion; // NodeFillingLight
                else
                    return global_NodeLayout['fillStyle'];
            })
    }


    this.onEdgesEntered = function(selection) {
       
        selection.append("line")
            .attr("class", "flow");
       

    }

    this.onEdgesUpdated = function(selection) {
        selection.selectAll("line.flow")
            .style("stroke-width",
                function(d) {
                    return algo.flowWidth(Graph.instance.edges.get(d.id)
                        .state.flow)
                });
        selection.selectAll("line.cap")
            .style("stroke-width",
                function(d) {
                    return algo.flowWidth(d.resources[0]);
                });


        selection.select(".arrow")
            .style("stroke",
                function(d) {
                    if(state.cycle.find(function(e) {
                            return e["edge"] == d.id;
                        }))
                        return "red";
                    else
                        return "black";
                })



        .attr("marker-end",
                function(d) {
                    if(!state.show_residual_graph) {
                        return "url(#flow-arrow2)";
                    } else {
                        if(d.resources[0] - d.state.flow > 0)
                            return "url(#residual-forward2)";
                        else
                            return "";
                    }
                })
            .attr("marker-start",
                function(d) {
                    if(!state.show_residual_graph) {
                        return "";
                    } else {
                        if(d.state.flow > 0)
                            return "url(#residual-backward2)";
                        else
                            return "";
                    }
                });


        selection.selectAll("line.cap")
            .style("visibility",
                function() {
                    return !state.show_residual_graph ? "visible" : "hidden";
                });
        selection.selectAll("line.flow")
            .style("visibility",
                function() {
                    return !state.show_residual_graph ? "visible" : "hidden";
                });


    }



    /**
     * Replay Stack, speichert alle Schritte des Ablaufs für Zurück Button
     * @type {Array}
     */
    var replayHistory = new Array();

	
    /**
     * Initialisiert das Zeichenfeld
     * @method
     */
    this.init = function() {
        Graph.addChangeListener(function() {
            that.clear();
            that.reset();
            that.squeeze();
            that.update();
        });

        this.reset();
        this.update();
        if(Graph.instance) {
			
            Exercise1.prototype.update.call(this); //updates the graph
        }


    };

    /**
     * clear all states
     */
    this.reset = function() {
            state = {
                current_step: STEP_BEGINALGORITHM, //status id
                sourceId: -1,
                targetId: -1,
                cycle_min_flow: 0,
                cycle: [],
                currentCost: 0
            };
            logger.data = [];
            this.replayHistory = [];
            this.currentFlow = 0;
            this.minCost = 0;
            frageStatus = new Object();
            frageParam = new Object();
            frageStats = {
                richtig: 0,
                falsch: 0,
                gestellt: 0
            };
			
			oldGraph = randomGraph;
			
    }
	
	
	/**
	 * Makes the view consistent with the state
	 * @method
	 */
    this.update = function() {

		this.updateDescriptionAndPseudocode();
		this.updateVariableState();
		this.updateGraphState();

		logger.update();
		if(Graph.instance) {
			Exercise1.prototype.update.call(this); //updates the graph

		}
	}
        
		
	/**
	 * When Tab comes into view
	 * @method
	 */
    this.activate = function() {
       
		$("#tf1_button_Retry").hide();

		this.chooseRandomGraph(9);
        Graph.setGraph("tf1");
		Graph.loadInstance("graphs-new/Ex1/graph" + randomGraph + ".txt");
        this.stopFastForward();
        this.clear();
        this.squeeze();
        Exercise1.prototype.update.call(this);	
		
		 $("#tf1_canvas_graph")
            .attr("visibility", "hidden");
        this.removeResultsTab();
		
        $("#tf1_button_start").show();
        $("#f1_started").hide();
        $("#tf1_button_1Schritt").button("option", "disabled", true);
        $("#tf1_button_vorspulen").button("option", "disabled", true);

        this.reset();
        this.squeeze();
        this.update();

        this.removeFrageTab();
        this.removeResultsTab();

		randomGraph = this.chooseRandomGraph(9);

        Graph.instance.edges.forEach(function(key, edge) {
            edge.state.flow = 0;
        });
		this.clear();
		this.reset();
		this.update();

		this.nextStepChoice();

    };

    this.refresh = function() {
        that.activate();
    }


    /**
     * tab disappears from view
     * @method
     */
    this.deactivate = function() {
        if(frageStatus.aktiv || frageStatus.warAktiv) {
            that.removeFrageTab();
        }
		oldGraph = randomGraph;
		
        this.removeResultsTab();
		
        this.stopFastForward();
        this.reset();
        this.clear();
        this.replayHistory = [];
		
        Graph.instance = null;
        Graph.setGraph("tg");
		this.reset();

    };

    this.resetExercise = function() {
  
        $("#tf1_button_start")
            .show();
        $("#f1-start")
            .show();		
		oldGraph = randomGraph;		
        this.frageParam = new Object();
        frageStats = {
            richtig: 0,
            falsch: 0,
            gestellt: 0
        };
    }


    this.beginAlgorithm = function() {	
		 $("#tf1_button_start")
            .click(
                function() {
                    $("#tf1_button_start").hide();
                    $("#f1-start").hide();
                    $("#f1_started").show();
					randomGraph = that.chooseRandomGraph(9);
					that.stopFastForward();
					that.clear();
					that.reset();
					that.update();
					that.squeeze();
					Exercise1.prototype.update.call(that);	

                   $("#tf1_button_1Schritt")
						.button("option", "disabled", false);

                    $("#tf1_canvas_graph")
                        .attr("visibility", "visible");
                    state.current_step = STEP_SELECTSOURCE;
                    that.squeeze();
		
				});
    }

	
    /**
     * add a step to the replay stack, serialize stateful data
     * @method
     */
    this.addReplayStep = function() {

        replayHistory.push({
            "graphState": Graph.instance.getState(),
            "currentFlow": currentFlow,
            "currentMinCost": minCost,
            "state": JSON.stringify(state),
            "legende": $("#tab_tf1")
                .find(".LegendeText")
                .html(),
            "loggerData": JSON.stringify(logger.data)
        });

        if(debugConsole)
            console.log("Current History Step: ", replayHistory[replayHistory.length - 1]);
    };

    /**
     * playback the last step from stack, deserialize stateful data
     * @method
     */
    this.previousStepChoice = function() {

        var oldState = replayHistory.pop();
        if(debugConsole)
            console.log("Replay Step", oldState);

        Graph.instance.setState(oldState.graphState);
        state = JSON.parse(oldState.state);
        logger.data = JSON.parse(oldState.loggerData);
        $("#tab_tf1")
            .find(".LegendeText")
            .html(oldState.legende);
        currentFlow = oldState.currentFlow;
        this.update();
    };


    this.updateDescriptionAndPseudocode = function() {
        var sel = d3.select("#tf1_div_statusPseudocode")
            .selectAll("div");
        sel.classed("marked", function(a, pInDivCounter, divCounter) {
            return d3.select(this)
                .attr("id") === "fr-pseudocode-" + state.current_step;
        });

        var sel = d3.select("#tf1_div_statusErklaerung")
            .selectAll("div");
        sel.style("display", function(a, divCounter) {
            return(d3.select(this)
                .attr("id") === "explanation-" + state.current_step) ? "block" : "none";
        });

        var disable_back_button = state.current_step === STEP_SELECTSOURCE;
        var disable_forward_button =
            (state.current_step === STEP_SELECTSOURCE ||
                state.current_step === STEP_SELECTTARGET ||
                state.current_step === STEP_FINISHED || frageStatus.aktiv);
        var disable_fastforward_button =
            (state.current_step === STEP_SELECTSOURCE ||
                state.current_step === STEP_SELECTTARGET ||
                state.current_step === STEP_FINISHED || frageStatus.aktiv);

        $("#tf1_button_Zurueck")
            .button("option", "disabled", disable_back_button);
        $("#tf1_button_1Schritt")
            .button("option", "disabled", disable_forward_button);
        $("#tf1_button_vorspulen")
            .button("option", "disabled", disable_fastforward_button);
    };

	
	
    this.updateGraphState = function() {
        var state_label = "";
        if(state.show_residual_graph) {
            state_label = "Residual Graph";
        } else {
            state_label = "Netzwerk"
        }
    }


    this.updateVariableState = function() {

        var cycle_edge_strings = [];
        var incomming = [];
        for(var i = state.cycle.length - 1; i >= 0; i--) //reverse to get path from s to t
        {
            var edge = Graph.instance.edges.get(state.cycle[i]["edge"]);
            if(incomming.length == 0) {
                if(edge.start.state.predecessor.direction == 1) {
                    var start_id = edge.start.id;
                    var end_id = edge.end.id;
                } else {
                    var start_id = edge.end.id;
                    var end_id = edge.start.id;
                }
            } else {
                for(var k = 0; k < incomming.length; k++) {
                    if(incomming[i] == edge.end.id) {
                        var start_id = edge.end.id;
                        var end_id = edge.start.id;
                    } else {
                        var start_id = edge.start.id;
                        var end_id = edge.end.id;
                    }
                }
            }

            incomming.push(end_id);
            var edge_string = "";
            if(start_id == state.sourceId)
                edge_string += "s";
            else if(start_id == state.targetId)
                edge_string += "t";
            else
                edge_string += start_id;

            edge_string += "->"

            if(end_id == state.sourceId)
                edge_string += "s";
            else if(end_id == state.targetId)
                edge_string += "t";
            else
                edge_string += end_id;

            cycle_edge_strings.push(edge_string);
        }
        var cycle_string = "[" + cycle_edge_strings.join(",") + "]";

        return cycle_string;
    }


    /////////////////actuall algorithm
	
    this.nextStepChoice = function(d) {
        var algoStatus = state.current_step;
        if(debugConsole)
            console.log("State Before: " + state.current_step);


        if(frageStatus.aktiv) {
            this.stopFastForward();
        }

        if(!frageStatus.aktiv) {
            if(frageStatus.warAktiv) {
                this.removeFrageTab();
                frageStatus.warAktiv = false;
            }
            // Speichere aktuellen Schritt im Stack
            this.addReplayStep();

            switch(algoStatus) {
				case STEP_BEGINALGORITHM:
                    frageStatus = {
                        "aktiv": false,
                        "warAktiv": false
                    };
					this.beginAlgorithm();
				
                case STEP_SELECTSOURCE:

                    this.selectSource(d);
                    break;
                case STEP_SELECTTARGET:
                    this.selectTarget(d);
					$("#tf1_button_1Schritt")
					.button("option", "disabled", false);
                    break;
                case STEP_START:
                    state.current_step = STEP_GETMAXFLOW;
                    if(frageStats.gestellt < min_questions || Math.random() < 0.5) {
                        this.askQuestion1();
                    } 
                    break;
                case STEP_GETMAXFLOW:
				    getMaxFlow();
					if(state.sourceId < state.targetId){
						
						this.askQuestion2(); 
					}else{
						this.endAlgorithm();
					}
                    break;
                case STEP_MAINLOOP:
                    mainLoop();
                    break;
                case STEP_FINDNEGATIVECYCLE:
                    findNegativeCycle();
                    break;
                case STEP_ADJUSTCYCLE:
                    adjustCycle();
                    if(state.sourceId < state.targetId){
						this.askQuestion2(); 
					} else{
						this.endAlgorithm();
					}
                    break;
                case STEP_FINISHED:
                    this.stopFastForward();
                    this.endAlgorithm();
                    break;
                default:
                    console.log("Fehlerhafter State");
                    break;
            }
            if(debugConsole)
                console.log("State After: " + state.current_step);

            //update view with status values
            this.update();
        }
    };

    this.selectSource = function(d) {
        state.sourceId = d.id;
        $("#tf1_select_GraphSelector")
            .hide();
        state.current_step = STEP_SELECTTARGET;
    };
    this.selectTarget = function(d) {
        state.targetId = d.id;
        state.current_step = STEP_START;
    };

    function getMaxFlow() {

        // edmonds-karp
        Graph.instance.edges.forEach(
            function(key, edge) {
                edge.state.flow = 0;
            })

        var no_path_found = false;
        currentFlow = 0;
        while(!no_path_found) {
            Graph.instance.nodes.forEach(
                function(key, node) {
                    node.state.predecessor = null;
                });
            var search_queue = [state.sourceId];
            var source = Graph.instance.nodes.get(state.sourceId);
            source.state.predecessor = {};
            while(Graph.instance.nodes.get(state.targetId)
                .state.predecessor == null && search_queue.length > 0) {
                var node_to_expand = search_queue.shift();
                var node = Graph.instance.nodes.get(node_to_expand);
                var out_edges = node.getOutEdges();
                for(var i = 0; i < out_edges.length; i++) {
                    var edge_out = out_edges[i];

                    if(edge_out.end.state.predecessor == null && edge_out.resources[0] > edge_out.state.flow) {
                        search_queue.push(edge_out.end.id);
                        edge_out.end.state.predecessor = {
                            "node": node_to_expand,
                            "edge": edge_out.id,
                            "residual-capacity": edge_out.resources[0] - edge_out.state.flow,
                            "direction": 1
                        };
                    }
                }

                var in_edges = node.getInEdges();
                for(var i = 0; i < in_edges.length; i++) {
                    var edge_in = in_edges[i];

                    if(edge_in.start.state.predecessor == null && edge_in.state.flow > 0) {
                        search_queue.push(edge_in.start.id);
                        edge_in.start.state.predecessor = {
                            "node": node_to_expand,
                            "edge": edge_in.id,
                            "residual-capacity": edge_in.state.flow,
                            "direction": -1
                        };
                    }
                }
            }

            if(Graph.instance.nodes.get(state.targetId)
                .state.predecessor != null) {
                var path = [];
                var augmentation = Number.MAX_SAFE_INTEGER;
                var next_path_node = state.targetId;

                //gather path
                while(next_path_node != state.sourceId) {
                    var node = Graph.instance.nodes.get(next_path_node);
                    path.push(node.state.predecessor);
                    augmentation = Math.min(node.state.predecessor["residual-capacity"], augmentation);
                    next_path_node = node.state.predecessor["node"];
                }

                //apply path
                for(var i = 0; i < path.length; i++) {
                    var predecessor = path[i];
                    var edge = Graph.instance.edges.get(predecessor["edge"]);
                    edge.state.flow += predecessor["direction"] * augmentation;
                }
                currentFlow += augmentation;

            } else
                no_path_found = true;
        }
        state.current_step = STEP_MAINLOOP;
        logger.log("Init to maxflow.");
    }


	
    /**
     * Entfernt den Tab für die Frage und aktiviert den vorherigen Tab.
     * @method
     */

    this.removeFrageTab = function() {
        if($("#tf1_div_statusTabs")
            .tabs("option", "active") == 2) {
            $("#tf1_div_statusTabs")
                .tabs("option", "active", tabVorFrage);
        }
        $("#tf1_li_FrageTab")
            .remove()
            .attr("aria-controls");
        $("#tf1_div_FrageTab")
            .remove();
        $("#tf1_div_statusTabs")
            .tabs("refresh");

        frageStatus.aktiv = false;
    };
	
	
    /**
     * Entfernt den Tab für die Ergebnisse und aktiviert den vorherigen Tab.
     * @method
     */
    this.removeResultsTab = function() {
        $("#tf1_div_statusTabs")
            .tabs("option", "active", 0);
        $("#tf1_li_ErgebnisseTab")
            .remove()
            .attr("aria-controls");
        $("#tf1_div_ErgebnisseTab")
            .remove();
        $("#tf1_div_statusTabs")
            .tabs("refresh");
    };


    /**
     * Fügt einen Tab für die Frage hinzu.<br>
     * Deaktiviert außerdem die Buttons zum Weitermachen
     * @method
     */

    this.addFrageTab = function() {
        this.stopFastForward();
        ++frageStats.gestellt;
        var li = "<li id='tf1_li_FrageTab'><a href='#tf1_div_FrageTab'>" + LNG.K('aufgabe1_text_question') + " " + frageStats.gestellt + "</a></li>";
        var id = "tf1_div_FrageTab";
        $("#tf1_div_statusTabs")
            .find(".ui-tabs-nav")
            .append(li);
        $("#tf1_div_statusTabs")
            .append("<div id='" + id + "'><div id='tf1_div_Frage'></div><div id='tf1_div_Antworten'></div><div id='tf1_div_Beg'></div></div>");
        $("#tf1_div_statusTabs")
            .tabs("refresh");
        tabVorFrage = $("#tf1_div_statusTabs")
            .tabs("option", "active");
        $("#tf1_div_statusTabs")
            .tabs("option", "active", 2);
        $("#tf1_button_1Schritt")
            .button("option", "disabled", true);
        $("#tf1_button_vorspulen")
            .button("option", "disabled", true);
    };


    /**
     * Stellt die Frage vom Typ 1
     * @method
     */
    this.askQuestion1 = function() {
        frageStatus.aktiv = true;
        this.addFrageTab();
        $("#tf1_div_Frage")
            .append("<p class=\"frage\">" + LNG.K('aufgabe1_question1') + "</p>");
		if(state.sourceId < state.targetId){
			this.frageParam = {
				Antwort: LNG.K('aufgabe1_answer1'),
				AntwortGrund: "<p>" + LNG.K('aufgabe1_answer1_reason1') + "</p>",
				gewusst: true
			};
		}else{
			this.frageParam = {
				Antwort: LNG.K('aufgabe1_answer1_2'),
				AntwortGrund: "<p>" + LNG.K('aufgabe1_answer1_reason2') + "</p>",
				gewusst: true
			};
	
		}
        // Reihenfolge zufaellig angezeigt
        var antwortReihenfolge = this.generateRandomOrder(2);
		
		//Anworten array: korrekte Loesung immer an erster stelle
		if(state.sourceId < state.targetId){
			var Antworten = [LNG.K('aufgabe1_text_yes'), LNG.K('aufgabe1_text_no')];
		}else{
	        var Antworten = [LNG.K('aufgabe1_text_no'), LNG.K('aufgabe1_text_yes')];
		}
        for(var i = 0; i < antwortReihenfolge.length; i++) {
            $("#tf1_div_Antworten")
                .append("<input type=\"radio\" id=\"tf1_input_frage1_" + antwortReihenfolge[i].toString() + "\" name=\"frage1\"/>" + "<label id=\"tf1_label_frage1_" + antwortReihenfolge[i].toString() + "\" for=\"tf1_input_frage1_" + antwortReihenfolge[i].toString() + "\">" + Antworten[antwortReihenfolge[i]] + "</label><br>");

        }
        $("#tf1_div_Antworten")
            .append("<br>");
		
        $("#tf1_input_frage1_1")
            .click(function() {
                $("#tf1_label_frage1_1")
                    .addClass("ui-state-error");
                document.getElementById("tf1_input_frage1_1")
                    .disabled = true;
                document.getElementById("tf1_input_frage1_0")
                    .disabled = true;
                that.frageParam.gewusst = false;
                that.handleCorrectAnswer();
            });


        $("#tf1_input_frage1_0")
            .click(function() {
                document.getElementById("tf1_input_frage1_1")
                    .disabled = true;
                document.getElementById("tf1_input_frage1_0")
                    .disabled = true;
                that.frageParam.gewusst = true;
                that.handleCorrectAnswer();
            });
    };


    /**
     * Zeigt Texte und Buttons zum Ende des Algorithmus
     * @method
     */
    this.endAlgorithm = function() {
        this.stopFastForward();
        this.showResults();
        $("#tf1_button_1Schritt")
            .button("option", "disabled", true);
        $("#tf1_button_vorspulen")
            .button("option", "disabled", true);
	
		oldGraph = randomGraph;
    };



    this.calculateMinCost = function() {
            minCost = 0;
            Graph.instance.edges.forEach(
                function(key, edge) {
                    return minCost += edge.state.flow * edge.resources[1];

                });
        }
		
		
	/**
	 * main loop: find negative cycles to reduce cost
	 */
    function mainLoop() {
        if(state.no_cycle_found) {
            state.current_step = STEP_FINISHED; //so that we display finished, not mainloop when done
            that.stopFastForward();
            that.calculateMinCost();
            logger.log("Finished with a min cost of " + finalflow);
            that.askQuestion4();

        } else {
            logger.log("Not finished, starting search for augmentation cycle ");
            state.show_residual_graph = true;
            state.current_step = STEP_FINDNEGATIVECYCLE;
            that.calculateMinCost();
			if(state.sourceId == 0 && state.targetId == d3.max(Graph.instance.getNodes(),function(d) {return d.id;}) && Graph.instance.minimalCost != minCost){
				that.askQuestion3();
			}

        }
    }


    /**
     * run bellman ford to find negative cycle
     */
    function findNegativeCycle() {

        Graph.instance.nodes.forEach(
            function(key, node) {
                node.state.distance = Number.MAX_SAFE_INTEGER;
                node.state.predecessor = null;
            });

        var target = Graph.instance.nodes.get(state.targetId);
        target.state.distance = 0;

        for(var i = 0; i < Graph.instance.nodes.size(); ++i) {
            Graph.instance.edges.forEach(
                function(key, edge) {
                    var node_start = edge.start; //Graph.instance.nodes.get(edge.start);
                    var node_end = edge.end; //Graph.instance.nodes.get(edge.end);

                    //adjust distance for edges in residual graph
                    if(edge.resources[0] > edge.state.flow) {

                        if(node_start.state.distance + edge.resources[1] < node_end.state.distance) {
                            node_end.state.distance = node_start.state.distance + edge.resources[1];
                            node_end.state.predecessor = {
                                "prev_node": node_start.id,
                                "edge": edge.id,
                                "direction": 1
                            };
                        }
                    }

                    if(edge.state.flow > 0) {
                        if(node_end.state.distance - edge.resources[1] < node_start.state.distance) {
                            node_start.state.distance = node_end.state.distance - edge.resources[1];
                            node_start.state.predecessor = {
                                "prev_node": node_end.id,
                                "edge": edge.id,
                                "direction": -1
                            };
                        }
                    }
                });
        }

        var has_cycle = false;

        Graph.instance.edges.forEach(
            function(key, edge) {
                var node_start = Graph.instance.nodes.get(edge.start.id);
                var node_end = Graph.instance.nodes.get(edge.end.id);

                //adjust distance for edges in residual graph
                if(edge.resources[0] > edge.state.flow) {
                    if(node_start.state.distance + edge.resources[1] < node_end.state.distance) {
                        has_cycle = true;

                    }
                }

                if(edge.state.flow > 0) {
                    if(node_end.state.distance - edge.resources[1] < node_start.state.distance) {
                        has_cycle = true;

                    }
                }
            });


        state.no_cycle_found = true;
        if(has_cycle) {
            state.cycle_min_flow = Number.MAX_SAFE_INTEGER;
            var cycle_node_stack = [state.targetId];
            while(state.no_cycle_found) {
                var last_node = Graph.instance.nodes.get(cycle_node_stack[cycle_node_stack.length - 1]);
                var new_node = last_node.state.predecessor.prev_node;

                state.cycle.push(last_node.state.predecessor)

                for(var i = 0; i < cycle_node_stack.length; i++) {
                    if(cycle_node_stack[i] == new_node) {
                        state.cycle.splice(0, i);
                        state.no_cycle_found = false;
                        break;
                    }
                }
                if(state.no_cycle_found) {
                    cycle_node_stack.push(new_node);
                }
            }

            for(var i = 0; i < state.cycle.length; ++i) {
                var cycle_edge = Graph.instance.edges.get(state.cycle[i].edge);
                if(state.cycle[i].direction == 1) {
                    state.cycle_min_flow = Math.min(state.cycle_min_flow, cycle_edge.resources[0] -cycle_edge.state.flow);

                } else {
                    state.cycle_min_flow = Math.min(state.cycle_min_flow, cycle_edge.state.flow);
                }

            }
        }

        if(!state.no_cycle_found) {
            state.current_step = STEP_ADJUSTCYCLE;
        } else {
            state.show_residual_graph = false;
            state.current_step = STEP_MAINLOOP;
        }

    }




    /**
     * adjust flow using the found cycle
     */
    function adjustCycle() {

            for(var i = 0; i < state.cycle.length; ++i) {
                var edge = Graph.instance.edges.get(state.cycle[i]["edge"]);

                edge.state.flow += state.cycle_min_flow * state.cycle[i]["direction"];
            }

            state.cycle_min_flow = 0;
            state.cycle = [];
            state.show_residual_graph = false;
            state.current_step = STEP_MAINLOOP;

        }
		
		
	/**
	 * Zeigt - im eigenen Tab - die Resultate der Aufgabe an.
	 * @method
	 */
    this.showResults = function() {
	
        var li = "<li id='tf1_li_ErgebnisseTab'><a href='#tf1_div_ErgebnisseTab'>" + LNG.K('aufgabe1_text_results') + "</a></li>",
            id = "tf1_div_ErgebnisseTab";
        $("#tf1_div_statusTabs")
            .find(".ui-tabs-nav")
            .append(li);
        $("#tf1_div_statusTabs")
            .append("<div id='" + id + "'></div>");
        $("#tf1_div_statusTabs")
            .tabs("refresh");
        $("#tf1_div_statusTabs")
            .tabs("option", "active", 2);
        if(frageStats.gestellt == frageStats.richtig) {
            $("#tf1_div_ErgebnisseTab")
                .append("<h2>" + LNG.K('aufgabe1_result3') + "</h2>");
            $("#tf1_div_ErgebnisseTab")
                .append("<h2>" + LNG.K('aufgabe1_result1') + "</h2>");
            $("#tf1_div_ErgebnisseTab")
                .append("<p>" + LNG.K('aufgabe1_result2') + "</p>");
            $("#tf1_div_ErgebnisseTab")
                .append('<button id="tf1_button_Retry">' + LNG.K('aufgabe1_btn_retry') + '</button>');				
			$("#tf1_button_Retry").show();
			$("#tf1_button_Retry")
                .button()
                .click(function() {
                    that.refresh();
                });
				
        } else {
            $("#tf1_div_ErgebnisseTab")
                .append("<h2>" + LNG.K('aufgabe1_result3') + "</h2>");
            $("#tf1_div_ErgebnisseTab")
                .append("<p>" + LNG.K('aufgabe1_result4') + " " + frageStats.gestellt + "</p>");
            $("#tf1_div_ErgebnisseTab")
                .append("<p>" + LNG.K('aufgabe1_result5') + " " + frageStats.richtig + "</p>");
            $("#tf1_div_ErgebnisseTab")
                .append("<p>" + LNG.K('aufgabe1_result6') + " " + frageStats.falsch + "</p>");
            $("#tf1_div_ErgebnisseTab")
                .append('<button id="tf1_button_Retry">' + LNG.K('aufgabe1_btn_retry') + '</button>');
			$("#tf1_button_Retry").show();
			$("#tf1_button_Retry")
                .button()
                .click(function() {
                    that.refresh();
                });
            
        }

    };
	
	
	
    /**
     * Stellt die Frage vom Typ 2
     * @method
     */
    this.askQuestion2 = function() {
        frageStatus.aktiv = true;
        this.addFrageTab();
        $("#tf1_div_Frage")
            .append("<p class=\"frage\">" + LNG.K('aufgabe1_question2') + "</p>");


        this.calculateMinCost();
        var richtigeAntwort = minCost;
		var randomAntwort1 = Math.floor(Math.random()*(richtigeAntwort + 3));
		
		while(randomAntwort1 == richtigeAntwort || randomAntwort1 == currentFlow || randomAntwort1 == 0){
			randomAntwort1 = Math.floor(Math.random()*(richtigeAntwort + 3));
		}
		
		var randomAntwort2 = Math.floor(Math.random()*(richtigeAntwort + 1));

		while(randomAntwort2 == richtigeAntwort || randomAntwort2 == currentFlow || randomAntwort2 == 0 || randomAntwort2 == randomAntwort1){
			randomAntwort2 = Math.floor(Math.random()*(richtigeAntwort + 1));
		}
		
		var randomAntwort3 = Math.floor(Math.random()*(richtigeAntwort + 7));
		
		while(randomAntwort3 == richtigeAntwort || randomAntwort3 == currentFlow || randomAntwort3 == 0 || randomAntwort3 == randomAntwort1 || randomAntwort3 == randomAntwort2){
			randomAntwort3 = Math.floor(Math.random()*(richtigeAntwort + 7));
		}
		var randomAntwort4 = Math.floor(Math.random()*(richtigeAntwort - 1));
		
		while(randomAntwort4 == richtigeAntwort || randomAntwort4 == currentFlow || randomAntwort4 == 0 || randomAntwort4 == randomAntwort1 || randomAntwort4 == randomAntwort2 || randomAntwort4 == randomAntwort3){
			randomAntwort4 = Math.floor(Math.random()*(richtigeAntwort - 1));
		}		
		
        var antwortReihenfolge = this.generateRandomOrder(7);
        var Antworten = [richtigeAntwort, currentFlow, "0", randomAntwort1, randomAntwort2, randomAntwort3 , randomAntwort4];

        for(var i = 0; i < antwortReihenfolge.length; i++) {
            $("#tf1_div_Antworten")
                .append("<input type=\"radio\" id=\"tf1_input_frage2_" + antwortReihenfolge[i].toString() + "\" name=\"frage2\"/>" + "<label id=\"tf1_label_frage2_" + antwortReihenfolge[i].toString() + "\" for=\"tf1_input_frage2_" + antwortReihenfolge[i].toString() + "\">" + Antworten[antwortReihenfolge[i]] + "</label><br>");

        }
        $("#tf1_div_Antworten")
            .append("<br>");


        for(var i = 0; i < 7; i++) {
            $("#tf1_input_frage2_" + i)
                .click(function() {
                    document.getElementById("tf1_input_frage2_0")
                        .disabled = true;
                    document.getElementById("tf1_input_frage2_1")
                        .disabled = true;
                    document.getElementById("tf1_input_frage2_2")
                        .disabled = true;
                    document.getElementById("tf1_input_frage2_3")
                        .disabled = true;
                    document.getElementById("tf1_input_frage2_4")
                        .disabled = true;
                    document.getElementById("tf1_input_frage2_5")
                        .disabled = true;
                    document.getElementById("tf1_input_frage2_6")
                        .disabled = true;
                });
        }


        $("#tf1_input_frage2_0")
            .click(function() {
                that.frageParam.gewusst = true;
                that.handleCorrectAnswer();
            });
        $("#tf1_input_frage2_1")
            .click(function() {
                $("#tf1_label_frage2_1")
                    .addClass("ui-state-error");
                that.frageParam.gewusst = false;
                that.handleCorrectAnswer();
            });
        $("#tf1_input_frage2_2")
            .click(function() {
                $("#tf1_label_frage2_2")
                    .addClass("ui-state-error");
                that.frageParam.gewusst = false;
                that.handleCorrectAnswer();
            });
        $("#tf1_input_frage2_3")
            .click(function() {
                $("#tf1_label_frage2_3")
                    .addClass("ui-state-error");
                that.frageParam.gewusst = false;
                that.handleCorrectAnswer();
            });
        $("#tf1_input_frage2_4")
            .click(function() {
                $("#tf1_label_frage2_4")
                    .addClass("ui-state-error");
                that.frageParam.gewusst = false;
                that.handleCorrectAnswer();
            });
        $("#tf1_input_frage2_5")
            .click(function() {
                $("#tf1_label_frage2_5")
                    .addClass("ui-state-error");
                that.frageParam.gewusst = false;
                that.handleCorrectAnswer();
            });
        $("#tf1_input_frage2_6")
            .click(function() {
                $("#tf1_label_frage2_6")
                    .addClass("ui-state-error");
                that.frageParam.gewusst = false;
                that.handleCorrectAnswer();
            });

        this.frageParam = {
            Antwort: minCost,
            AntwortGrund: "<p>" + LNG.K('aufgabe1_answer2_reason2') +
                minCost +
                "</p>",
            gewusst: true
        };

    };

	
	
    /**
     * Stellt die Frage vom Typ 3
     * @method
     */
    this.askQuestion3 = function() {

        frageStatus.aktiv = true;
        this.addFrageTab();
        $("#tf1_div_Frage")
            .append("<p class=\"frage\">" + LNG.K('aufgabe1_question3') + "</p>");
       
        this.frageParam = {
            Antwort: LNG.K('aufgabe1_answer3'),
            AntwortGrund: "<p>" + LNG.K('aufgabe1_answer3_reason1') + "</p>",
            gewusst: true
        };

        // Reihenfolge zufaellig angezeigt
        var antwortReihenfolge = this.generateRandomOrder(2);
       
	   //Anworten array: korrekte Loesung immer an erster stelle
        var Antworten = [LNG.K('aufgabe1_text_yes'), LNG.K('aufgabe1_text_no')];

        for(var i = 0; i < antwortReihenfolge.length; i++) {
            $("#tf1_div_Antworten")
                .append("<input type=\"radio\" id=\"tf1_input_frage3_" + antwortReihenfolge[i].toString() + "\" name=\"frage1\"/>" + "<label id=\"tf1_label_frage1_" + antwortReihenfolge[i].toString() + "\" for=\"tf1_input_frage3_" + antwortReihenfolge[i].toString() + "\">" + Antworten[antwortReihenfolge[i]] + "</label><br>");

        }
        $("#tf1_div_Antworten")
            .append("<br>");

        $("#tf1_input_frage3_1")
            .click(function() {

                $("#tf1_label_frage3_1")
                    .addClass("ui-state-error");
                document.getElementById("tf1_input_frage3_1")
                    .disabled = true;
                document.getElementById("tf1_input_frage3_0")
                    .disabled = true;
                that.frageParam.gewusst = false;
                that.handleCorrectAnswer();
            });


        $("#tf1_input_frage3_0")
            .click(function() {
                document.getElementById("tf1_input_frage3_1")
                    .disabled = true;
                document.getElementById("tf1_input_frage3_0")
                    .disabled = true;
                that.frageParam.gewusst = true;
                that.handleCorrectAnswer();
            });

    };


    this.askQuestion4 = function() {

        frageStatus.aktiv = true;
        this.addFrageTab();
        $("#tf1_div_Frage")
            .append("<p class=\"frage\">" + LNG.K('aufgabe1_question4') + "</p>");
       
        this.frageParam = {
            Antwort: LNG.K('aufgabe1_answer4'),
            AntwortGrund: "<p>" + LNG.K('aufgabe1_answer4_reason1') + "</p>",
            gewusst: true
        };

        // Reihenfolge zufaellig angezeigt
        var antwortReihenfolge = this.generateRandomOrder(2);
        
		//Anworten array: korrekte Loesung immer an erster stelle
        var Antworten = [LNG.K('aufgabe1_text_no'), LNG.K('aufgabe1_text_yes')];

        for(var i = 0; i < antwortReihenfolge.length; i++) {
            $("#tf1_div_Antworten")
                .append("<input type=\"radio\" id=\"tf1_input_frage4_" + antwortReihenfolge[i].toString() + "\" name=\"frage1\"/>" + "<label id=\"tf1_label_frage1_" + antwortReihenfolge[i].toString() + "\" for=\"tf1_input_frage4_" + antwortReihenfolge[i].toString() + "\">" + Antworten[antwortReihenfolge[i]] + "</label><br>");
        }
        $("#tf1_div_Antworten")
            .append("<br>");

        $("#tf1_input_frage4_1")
            .click(function() {
                $("#tf1_label_frage4_1")
                    .addClass("ui-state-error");
                document.getElementById("tf1_input_frage4_1")
                    .disabled = true;
                document.getElementById("tf1_input_frage4_0")
                    .disabled = true;
                that.frageParam.gewusst = false;
                that.handleCorrectAnswer();
            });


        $("#tf1_input_frage4_0")
            .click(function() {
                document.getElementById("tf1_input_frage4_1")
                    .disabled = true;
                document.getElementById("tf1_input_frage4_0")
                    .disabled = true;
                that.frageParam.gewusst = true;
                that.handleCorrectAnswer();
            });

    };



    /**
     * Generiert eine zufällige Permutation von einem Array<br>
     * @param {Number} Anzahl von Elementen der Permutation
     * @returns {Array} zufällige Permutation
     * @method
     */
    this.generateRandomOrder = function(l) {
        var array = new Array();
        for(var i = 0; i < l; i++) array.push(i);
        for(var i = l - 1; i >= 0; i--) {
            var random = Math.floor(Math.random() * (i + 1));
            var tmp = array[i];
            array[i] = array[random];
            array[random] = tmp;
        }
        return array;

    };
	
	/** 
	*  Chooses a random number (that corresponds to a graph) and makes sure, that
	*  the chosen number is not the same as the last one that was chosen, i.e. the 
	*  graphs are different for any two succesive executions of exercise 1.
	*  @param {Number} Number of available graphs
    *  @returns {Number} The number of the chosen random graph
    *  @method
	*/	
	this.chooseRandomGraph = function(numOfGraphs){
		while(randomGraph == oldGraph){
			randomGraph = Math.floor(Math.random()*(numOfGraphs)+1);
		}
			
		return randomGraph;
	}


  
	this.handleCorrectAnswer = function() {
        $("#tf1_button_1Schritt")
            .button("option", "disabled", false);
        $("#tf1_button_vorspulen")
            .button("option", "disabled", false);


        if(this.frageParam.gewusst) {
            $("p.frage")
                .css("color", const_Colors.GreenText);
            $("#tf1_div_Antworten")
                .html("<h2>" + LNG.K('aufgabe1_text_right_answer') + " " + this.frageParam.Antwort + "</h2>");
            $("#tf1_div_Beg")
                .append(this.frageParam.AntwortGrund);
            frageStats.richtig++;
        } else {
            $("p.frage")
                .css("color", const_Colors.RedText);
            $("#tf1_div_Beg")
                .html("<h2>" + LNG.K('aufgabe1_text_wrong_answer') + "</h2>");
            $("#tf1_div_Antworten")
                .html("<h2>" + LNG.K('aufgabe1_text_right_answer') + " " + this.frageParam.Antwort + "</h2>");
            $("#tf1_div_Beg")
                .append(this.frageParam.AntwortGrund);
            frageStats.falsch++;
        }
        // update graph
        if(Graph.instance) {
            Exercise1.prototype.update.call(this);
        }
        frageStatus = {
            "aktiv": false,
            "warAktiv": true
        };

    };

	
    this.getWarnBeforeLeave = function() {
        if(state.current_step == STEP_SELECTSOURCE || state.current_step == STEP_FINISHED) {
            return false;
        }
        return true;
    }

}

// Vererbung realisieren
Exercise1.prototype = Object.create(GraphDrawer.prototype);
Exercise1.prototype.constructor = Exercise1;
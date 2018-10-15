function Exercise2(svgSelection) {
    //FordFulkersonAlgorithm.call(this, svgSelection);
    GraphDrawer.call(this, svgSelection, null, null, "tf2");

    var svgOrigin = d3.select("body")
        .select("svg");
    var svg = d3.select("#tf2_canvas_graph");
    this.svgOrigin
        .on("mousedown", mousedown);
    // event handler for enter key
    d3.select("body")
        .on("keydown", function() {
            var key = d3.event.keyCode;
            if(key == 13) { // enter key code
                mousedown();
            }
        });


    //insert markers
    var definitions = svgSelection.append("defs")
        .attr("id", "line-markers");

    definitions.append("marker")
        .attr("id", "flow-arrow3")
        .attr("refX", 12) /*must be smarter way to calculate shift*/
        .attr("refY", 2)
        .attr("markerWidth", 12)
        .attr("markerHeight", 4)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M 0,0 V 4 L6,2 Z")
        .attr("fill", const_Colors.NormalEdgeColor); //this is actual shape for arrowhead

    definitions.append("marker")
        .attr("id", "residual-forward3")
        .attr("refX", 14) /*must be smarter way to calculate shift*/
        .attr("refY", 3)
        .attr("markerWidth", 14)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M 2,3 L0,6 L8,3 Z")
        .attr("fill", const_Colors.NormalEdgeColor); //this is actual shape for arrowhead

    definitions.append("marker")
        .attr("id", "residual-backward3")
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

    var tabVorfrage = null;
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
     *  Die nextStepChoice Methode der Oberklasse
     *  @type method
     */
    this.algoNext = this.nextStepChoice;



    // Ex 2
    var numQuestions = 3;

    var currentFlow = 0;
    var minCost = 0;

    var STEP_START = "start-algorithm";
    var STEP_ASKQUESTION = "ask-question";
    var STEP_FINISHED = "finished";


    var state = {
        sourceId: -1,
        targetId: -1,
        cycle_min_flow: 0,
        cycle: [],
        currentCost: 0,
        flow: 0
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
    };


    this.resetExercise = function() {
        $("#tf2_Selector")
            .show();
        $("#tf2_button_start")
            .show();
        $("#f2-start")
            .show();

        numQuestions = 3;
        this.frageParam = new Object();
        frageStats = {
            richtig: 0,
            falsch: 0,
            gestellt: 0
        };
    };

    this.nodeText = "";

   
    this.edgeText = function(d) {
        if(d.selected && d.hin) {
            return "?";
		}else if($.inArray(d,selectedEdges) != -1 && d.hin){
			var res = d.answerCap + ", " + d.answerCost;
			return res;
        } else if(d.rueck) {
            var res = (d.backupCap - d.temp) + ", " + d.tempCost;
            return res;
        } else {
            var res = (d.backupCap - d.state.flow) + ", " + d.state.cost;
            return res;
        }


    };

	
    this.edgeTextBelow =
        function(d) {
            if(d.selected && d.rueck) {
                return "?";
			}else if($.inArray(d,selectedEdges) != -1 && d.rueck){
				var res = d.answerCap + ", " + d.answerCost;
				return res;
            } else if(d.hin) {              
                var res = d.temp + ", " + -d.tempCost;
                return res;
            } else {
                var res = d.state.flow + ", " + -d.state.cost;
                return res;
            }
        };




    this.onNodesEntered = function(selection) {};

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
            });


    };

    this.onEdgesEntered = function(selection) {
        selection.append("line")
            .attr("class", "cap")
            .style("stroke-width",
                function(d) {
                    return algo.flowWidth(d.resources[0]);
                });

        selection.append("line")
            .attr("class", "flow");

    };

    this.onEdgesUpdated = function(selection) {

        selection.selectAll("line.flow")
            .style("stroke-width",
                function(d) {
                    return algo.flowWidth(Graph.instance.edges.get(d.id)
                        .state.flow);
                });
        selection.selectAll("line.cap")
            .style("stroke-width",
                function(d) {
                    return algo.flowWidth(d.resources[0]);
                });

        selection.select(".arrow")
            .style("stroke",
                function(d) { 
                    if(state.path.find(function(pred) {
                            return pred.edge == d.id;
                        }))
                        return "red";
                    else
                        return "black";
                })
            .attr("marker-end",
                function(d) {
                    if(!state.show_residual_graph) {
                        return "url(#flow-arrow3)";
                    } else {
                        return "url(#residual-forward3)";
                    }
                })
            .attr("marker-start",
                function(d) {
                    if(!state.show_residual_graph) {
                        return "";
                    } else {
                        return "url(#residual-backward3)";
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

    };


    /**
     * Replay Stack, speichert alle Schritte des Ablaufs für Zurück Button
     * @type {Array}
     */
    var replayHistory = new Array();

    this.init = function() {


        Graph.addChangeListener(function() {
            that.clear();
            that.reset();
            that.squeeze();
            that.update();
        });

        this.clear();
        this.reset();
        this.update();

    };

    /**
     * clear all states
     */
    this.reset = function() {
        state = {
            current_step: STEP_START, //status id
            sourceId: -1,
            targetId: -1,
            cycle_min_flow: 0,
            cycle: [],
            currentCost: 0,
            no_path_found: false,
            show_residual_graph: true,
            search_queue: [],
            next_node_to_search: null,
            path: [],
            next_path_node: null,
            augmentation: 0
        };

        logger.data = [];
        this.replayHistory = [];
        currentFlow = 0;

        frage = {
            "aktiv": false,
            "warAktiv": false
        };

        this.frageParam = new Object();
        frageStats = {
            richtig: 0,
            falsch: 0,
            gestellt: 0
        };
        tabVorFrage = null;

        if(Graph.instance) {
            //prepare graph for this algorithm: add special properties to nodes and edges
            Graph.instance.nodes.forEach(function(key, node) {
                node.state.predecessor = null;
            })
        }

    };

    this.update = function() {

        this.updateDescriptionAndPseudocode();
        this.updateVariables();
        this.updateGraphState();


        logger.update();

        if(Graph.instance) {
            Exercise2.prototype.update.call(this); //updates the graph
        }
    };


    /**
     * When Tab comes into view
     * @method
     */
    this.activate = function() {

        $("#tf2_canvas_graph")
            .attr("visibility", "hidden");

        Graph.loadInstance("graphs-new/Ex2/graph3.txt");
        this.stopFastForward();
        this.clear();
        this.squeeze();
        Exercise2.prototype.update.call(this);


        $("#tf2_button_1Schritt")
            .button("option", "disabled", true);

        this.reset();
        this.update();

        this.removeFrageTab();
        this.removeResultsTab();
        this.resetExercise();

        d3.select("body")
            .on("mousemove", that.registerEventHandlers);

        this.nextStepChoice();

    };

    this.refresh = function() {
        that.activate();
    };

    var frage = new Object();

    /**
     * tab disappears from view
     * @method
     */
    this.deactivate = function() {
        if(frage.aktiv || frage.warAktiv) {
            that.removeFrageTab();
        }
        this.removeResultsTab();

        this.stopFastForward();
        //  this.reset();
        this.clear();
		this.reset();
        Graph.instance = null;
		Graph.setGraph("tg");
        this.replayHistory = [];
		
		this.reset();

		var selection = svgOrigin.selectAll("g.edge");
        selection.on("mouseover", null);
        selection.on("mouseleave", null);  
        selection.on("click", null);  
        selection.on("dblclick", null);

    };


    this.updateDescriptionAndPseudocode = function() {
        var disable_forward_button = (state.current_step === STEP_START || state.current_step === STEP_FINISHED || frage.aktiv);
        $("#tf2_button_1Schritt")
            .button("option", "disabled", disable_forward_button);

    };


    this.updateGraphState = function() {
        var state_label = "Residual Network";
        d3.select("#f2-graph-state")
            .text(state_label);
        d3.select("#f2-graph-info")
            .style("display", (!frage.aktiv) ? "none" : "block");

        if(Graph.instance) {
            d3.select("#f2-flow-info")
                .text("Current Flow: " + Graph.instance.actualFlow);
            d3.select("#f2-graph-flow")
                .style("display", (!frage.aktiv) ? "none" : "block");
        }

    };

    this.updateVariables = function() {
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
     
        d3.select("#f2-finalflow")
            .text(currentFlow);
    };


    this.nextStepChoice = function(d) {

        var algoStatus = state.current_step;

        if(frage.aktiv) {
            this.stopFastForward();
        }

        if(!frage.aktiv) {
            if(frage.warAktiv) {
                this.removeFrageTab();
                frage.warAktiv = false;
            }


            switch(algoStatus) {
                case STEP_START:
                    frage = {
                        "aktiv": false,
                        "warAktiv": false
                    };

                    this.beginAlgorithm();
                    break;
                case STEP_ASKQUESTION:
                    this.askQuestion();
                    break;
                case STEP_FINISHED:
                    this.endAlgorithm();
                    break;
                default:
                    console.log("Fehlerhafter State");
                    break;
            }

            this.update();
        }
    };

    var netzwerke = new Array();

    this.beginAlgorithm = function() {
        $("#tf2_button_start")
            .click(
                function() {
                    $("#tf2_Selector")
                        .hide();
                    $("#tf2_button_start")
                        .hide();
                    $("#f2-start")
                        .hide();
                    numQuestions = $("#tf2_Selector>option:selected")
                        .val();
     
                    // zufaellige Reihenfolge von Netzwerken
                    netzwerke = new Array();
                    for(var i = 1; i <= numQuestions; i++) {
                        netzwerke.push(i);

                    }

                    netzwerke = mixArray(netzwerke);

                    Graph.loadInstance("graphs-new/Ex2/graph" + netzwerke[0] + ".txt");

                    that.selectSourceAndTarget();
                    that.stopFastForward();
                    that.clear();
                    that.squeeze();
                    Exercise2.prototype.update.call(that);

                    $("#tf2_canvas_graph")
                        .attr("visibility", "visible");
                    state.current_step = STEP_ASKQUESTION;
                    that.clear();
                    that.squeeze();
 
                    $("#tf2_button_1Schritt")
                        .button("option", "disabled", false);

                });
    };

    this.askQuestion = function() {
        if(numQuestions == frageStats.gestellt) {
            state.current_step = STEP_FINISHED;
            this.endAlgorithm();
            return;
        }
		Graph.instance.edges.forEach(function(key,edge){
			edge.backupCap = edge.resources[0];
		});
        frage.aktiv = true;
        this.addFrageTab();


    };

    this.endAlgorithm = function() {
        this.showResults();
    };


    this.selectSourceAndTarget = function() {
        state.sourceId = 0;
        state.targetId = d3.max(Graph.instance.getNodes(),
            function(d) {
                return d.id;
            });

    }



    /**
     * Entfernt den Tab für die Frage und aktiviert den vorherigen Tab.
     * @method
     */
    this.removeFrageTab = function() {
        if($("#tf2_div_statusTabs")
            .tabs("option", "active") == 1) {
            $("#tf2_div_statusTabs")
                .tabs("option", "active", tabVorFrage);
        }
        $("#tf2_li_FrageTab")
            .remove()
            .attr("aria-controls");
        $("#tf2_div_FrageTab")
            .remove();
        $("#tf2_div_statusTabs")
            .tabs("refresh");

        Graph.instance.edges.forEach(function(key, edge) {

            if(edge.selected) {
                edge.selected = false;
            }
            if(edge.hin) {
                edge.hin = false;
            }
            if(edge.rueck) {
                edge.rueck = false;
            }
            if(edge.temp) {
                edge.state.flow = edge.temp;
                edge.temp = null;
            }
            if(edge.tempCost) {

                edge.state.cost = edge.tempCost;
                edge.tempCost = null;
            }
        });

        frage.aktiv = false;

    };

    /**
     * Entfernt den Tab für die Ergebnisse und aktiviert den vorherigen Tab.
     * @method
     */
    this.removeResultsTab = function() {
        $("#tf2_div_statusTabs")
            .tabs("option", "active", 0);
        $("#tf2_li_ErgebnisseTab")
            .remove()
            .attr("aria-controls");
        $("#tf2_div_ErgebnisseTab")
            .remove();
        $("#tf2_div_statusTabs")
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
        geantwortet = 0;
        
        this.stopFastForward();
        this.clear();
        this.squeeze();
        Exercise2.prototype.update.call(this);
        that.selectSourceAndTarget();

        var li = "<li id='tf2_li_FrageTab'><a href='#tf2_div_FrageTab'>" + LNG.K('aufgabe2_text_question') + " " + frageStats.gestellt + "</a></li>";
        var id = "tf2_div_FrageTab";
        $("#tf2_div_statusTabs")
            .find(".ui-tabs-nav")
            .append(li);
        $("#tf2_div_statusTabs")
            .append("<div id='" + id + "'><div id='tf2_div_Frage'></div><div id='tf2_div_Antworten'></div><div id='tf2_div_Beg'></div></div>");
        $("#tf2_div_statusTabs")
            .tabs("refresh");
        tabVorFrage = $("#tf2_div_statusTabs")
            .tabs("option", "active");
        $("#tf2_div_statusTabs")
            .tabs("option", "active", 1);


        $("#tf2_button_1Schritt")
            .button("option", "disabled", true);

        var fluss = Graph.instance.actualFlow;
        $("#tf2_div_Frage")
            .append("<h2 id=\"tf2_titel\"> Network with current flow: " + fluss + "</h2>");



        $("#tf2_div_Frage")
            .append("<img id=\"tf2_img\" src=\"img/Ex2/ex0" + netzwerke[frageStats.gestellt - 1] + ".svg\" width=\"350\"/><br><p> </p>");


        $("#tf2_div_Frage")
            .append("<br><p> </p><p>  </p><p>  </p><center><button id=\"tf2_button_EV\">Check results!</button> </center>");

        // Speichert zufaellige Kanten fuer das jeweilige Augmentationsnetzwerk
        selectedEdges = new Array();
        var keys = [];
        Graph.instance.edges.forEach(function(edgeID, edge) {
            keys.push(edgeID);
        });
        var rand = Math.floor(Math.random() * (keys.length - 2)) + 2;

        for(var i = 0; i < rand; i++) {
            selectedEdges.push(selectEdge());
        }

        $("#tf2_button_EV")
            .button()
            .click(
                function() {
                    that.handleCorrectAnswer();
                }
            );
        $("#tf2_div_Frage")
            .append("<p id=\"tf2_nochNicht\"></p>");

    };


    var selectedEdges = new Array();
    var geantwortet = 0;

    function selectEdge() {
        //Waehle zufaellige Kante
        var keys = [];
        Graph.instance.edges.forEach(function(edgeID, edge) {
            keys.push(edgeID);
        });
        var rand = Math.floor(Math.random() * keys.length);
        edge = Graph.instance.edges.get(keys[rand]);

        while(edge.selected) {
            rand = Math.floor(Math.random() * keys.length);
            edge = Graph.instance.edges.get(keys[rand]);
        }

        var rand2 = Math.floor(Math.random()*2);
        if(rand2 < 0.5) {
            edge.hin = true;
            edge.rueck = false;
        } else {
            edge.hin = false;
            edge.rueck = true;
        }

        edge.temp = edge.state.flow;
        edge.tempCost = edge.state.cost;
		edge.resources[0] = 0;
		edge.resources[1] = 0;
        edge.selected = true;
        return edge;
    }

    /**
     * Zeigt - im eigenen Tab - die Resultate der Aufgabe an.
     * @method
     */
    this.showResults = function() {
        $("#tf2_canvas_graph")
            .attr("visibility", "hidden");

        var li = "<li id='tf2_li_ErgebnisseTab'><a href='#tf2_div_ErgebnisseTab'>" + LNG.K('aufgabe2_text_results') + "</a></li>",
            id = "tf2_div_ErgebnisseTab";
        $("#tf2_div_statusTabs")
            .find(".ui-tabs-nav")
            .append(li);
        $("#tf2_div_statusTabs")
            .append("<div id='" + id + "'></div>");
        $("#tf2_div_statusTabs")
            .tabs("refresh");
        $("#tf2_div_statusTabs")
            .tabs("option", "active", 1);
        if(frageStats.gestellt == frageStats.richtig) {
            $("#tf2_div_ErgebnisseTab")
                .append("<h2>" + LNG.K('aufgabe2_result3') + "</h2>");
            $("#tf2_div_ErgebnisseTab")
                .append("<h2>" + LNG.K('aufgabe2_result1') + "</h2>");
            $("#tf2_div_ErgebnisseTab")
                .append("<p>" + LNG.K('aufgabe2_result2') + "</p>");
        } else {
            $("#tf2_div_ErgebnisseTab")
                .append("<h2>" + LNG.K('aufgabe2_result3') + "</h2>");
            $("#tf2_div_ErgebnisseTab")
                .append("<p>" + LNG.K('aufgabe2_result4') + " " + frageStats.gestellt + "</p>");
            $("#tf2_div_ErgebnisseTab")
                .append("<p>" + LNG.K('aufgabe2_result5') + " " + frageStats.richtig + "</p>");
            $("#tf2_div_ErgebnisseTab")
                .append("<p>" + LNG.K('aufgabe2_result6') + " " + frageStats.falsch + "</p>");
            $("#tf2_div_ErgebnisseTab")
                .append('<br><button id="tf2_button_Retry">' + LNG.K('aufgabe2_btn_retry') + '</button>');
            $("#tf2_button_Retry")
                .button()
                .click(function() {
                    that.refresh();
                });

        };


    }

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


    //aktualisiert FrageStats und gibt den Text fuer die Begrundung aus
    this.handleCorrectAnswer = function() {

        if(geantwortet != selectedEdges.length) {
            $("#tf2_nochNicht")
                .css("color", "red");
            var fehlt = selectedEdges.length - geantwortet;
            if(fehlt == 1) {
                $("#tf2_nochNicht")
                    .html("You have to fill out " + fehlt + " more field!");

            } else {
                $("#tf2_nochNicht")
                    .html("You have to fill out " + fehlt + " more fields!");
            }

        } else {
            blurResourceEditor();
            var fehler = false;
            var richtig = 0;
            Graph.instance.edges.forEach(function(edgeID, d) {
                if(d.temp && d.tempCost) {
					if(d.hin){
						if(d.backupCap - d.temp == d.answerCap && d.tempCost == d.answerCost) {
							d.correct = true;
							richtig++;
						} else {
							d.correct = false;
							fehler = true;
						}
					}else if(d.rueck){
						if(d.temp == d.answerCap && -d.tempCost == d.answerCost) {
							d.correct = true;
							richtig++;
						} else {
							d.correct = false;
							fehler = true;
						}
					}
                }
            });
            that.update();

            $("#tf2_nochNicht")
                .html(" ");
            $("#tf2_titel")
                .html("Solution")
            $("#tf2_img")
                .attr("src", "img/Ex2Lo/ex0" + netzwerke[frageStats.gestellt - 1] + ".svg");

            $("#tf2_button_EV")
                .remove();

            var txt;
            if(fehler) {
                txt = "<p><strong>Nicht ganz richtig!</strong></p> ";
                frageStats.falsch++;
            } else {
                txt = "<p><strong>Sehr gut!</strong></p>";
                frageStats.richtig++;

            }
            $("#tf2_div_Antworten")
                .append(txt);
            $("#tf2_div_Antworten")
                .append("<p> You have filled out " + richtig + " out of " + selectedEdges.length + " fields correctly.</p>");


            Graph.loadInstance("graphs-new/Ex2/graph" + netzwerke[frageStats.gestellt] + ".txt");

            $("#tf2_button_1Schritt")
                .button("option", "disabled", false);

            frage = {
                "aktiv": false,
                "warAktiv": true
            };
        }
    };

    function mixArray(arr) {
        var tmp, rand;
        for(var i = 0; i < arr.length; i++) {
            rand = Math.floor(Math.random() * arr.length);
            tmp = arr[i];
            arr[i] = arr[rand];
            arr[rand] = tmp;
        }
        return arr;
    }
    this.registerEventHandlers = function() {
        var selection = d3.selectAll("g.edge");
        selection.on("mouseover", function(d) {
            if(d.selected) {
                svg.style("cursor", "pointer");
            }
        });
        selection.on("mouseleave", function(d) {
            if(d.selected) {
                svg.style("cursor", "default");
            }
        });
        selection.on("click", dblclickResource);
        selection.on("dblclick", dblclickResource);
    }

    function dblclickResource(d, i, all) {
        if(d.selected) {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            updateResources(d.resources, d);
            geantwortet++;
        }
    }


    var myDiv = d3.select("body"); //.append("div")

    function updateResources(data, d) {

        var selection = myDiv.selectAll("input.resourceEditor")
            .data(data);
        selection.enter()
            .append("input")
            .attr("type", "number")
            .attr("id", "value")
            .attr("class", "tooltip resourceEditor")
        selection
            .attr("value",function(a,b,c){
			 if(d.hin) {
				
				d.state.flow = d.resources[0];
				//d.state.cost = d.resources[1];
			} else {
				d.state.flow = 0;
				//d.state.cost = 0;
			}
			d.answerCap = 0;
			d.answerCost = 0;
			d.state.cost = 0;
            d.selected = false;
            that.update();
			return 0;
			
		  })
		  .on("input", function(a,b,c) {
			 data[b] = 0;
			 data[b]=+this.value;
			 if(data[0]<0){
			   data[0] = 0;
			 }
			 if(data[1])
			 d.answerCost = data[1];
			 if(data[0])
			 d.answerCap = data[0];			
			 d.selected = false;
			 that.update()
		  })
            .style("left", function(a, b, c) {
                return(d3.event.pageX - 30 + 40 * b) + "px"
            })
            .style("top", function(a, b, c) {
                return(d3.event.pageY + 15) + "px"
            })

        selection.exit().remove();
    }


    function mousedown() {
        blurResourceEditor();
    }

    function blurResourceEditor() {
        updateResources([]);
    }

	var answerCost = new Array();
	var answerCap = new Array();


}

// Vererbung realisieren
Exercise2.prototype = Object.create(GraphDrawer.prototype);
Exercise2.prototype.constructor = Exercise2;
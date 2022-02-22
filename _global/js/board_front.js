
window.onload = function startMain(){
    parseGrowthTags();
    if(document.getElementById("presence-table")) {
        enhancePresenceTracksTable();
    } else {        
        setNewEnergyCardPlayTracks(parseEnergyTrackTags(), parseCardPlayTrackTags());
    }
    parseInnatePowers();
    const board = document.querySelectorAll('board')[0];
    
    var html = board.innerHTML;
    board.innerHTML = replaceIcon(html);
    dynamicCellWidth();
    dynamicSpecialRuleHeight(board)
    
    // I moved this to the end so that the image could rescale to the special box
    addImages(board)
}
function dynamicSpecialRuleHeight(board){
    const specialRules = board.querySelectorAll('special-rules-container')[0]
    let height = specialRules.getAttribute('height')

    if(!height){
        const computedStyle = window.getComputedStyle(specialRules)
        height = computedStyle.getPropertyValue('height')
    }


    const spiritName = board.querySelectorAll('spirit-name')[0]
    if(specialRules){
        specialRules.style.top = `calc(100% - ${height})`
        specialRules.style.height = height
    }
    if(spiritName){
        spiritName.style.top = `calc(100% - ${height})`
    }
}

function addImages(board) {

    const spiritImage = board.getAttribute('spirit-image');

    const spiritBorder = board.getAttribute('spirit-border');
    
    const imageSize = board.getAttribute('spirit-image-scale');

    
    const specialRules = board.querySelectorAll('special-rules-container')[0]
    let height = specialRules.getAttribute('height')
        if(!height){
        const computedStyle = window.getComputedStyle(specialRules)
        height = computedStyle.getPropertyValue('height')
    }
    
    if(spiritBorder){
        const specialRules = board.querySelectorAll('special-rules-container')[0]
        specialRules.innerHTML = `<div class="spirit-border" style="background-image: url(${spiritBorder});" ></div>` + specialRules.innerHTML
    }
    if(spiritImage){
        //Image now scales to fill gap. 'imageSize' allows the user to specify what % of the gap to cover
        board.innerHTML = `<div class="spirit-image" style="background-image: url(${spiritImage}); background-size: auto ${imageSize}; height:calc(100% - ${height}); width:1700px;" ></div>` + board.innerHTML
    }
}

function parseGrowthTags(){
    var fullHTML = "";
    var growthHTML = document.getElementsByTagName("growth");
    
    var growthTitle = "<section-title>"+growthHTML[0].title+"</section-title>";

    const subList = Array.from(growthHTML[0].getElementsByTagName('sub-growth'))
    let subTitle = subList
        .map(e => `<sub-section-title><sub-section-line></sub-section-line><span>${e.title}</span><sub-section-line></sub-section-line></sub-section-title>`).join('')



    var newGrowthTableTagOpen = "<growth-table>";
    var newGrowthTableTagClose = "</growth-table>";

    //Find values between parenthesis
    var regExp = /\(([^)]+)\)/;
    var newGrowthCellHTML = "";
    let currentHeaderIndex = 0

    for (let i = 0; i < growthHTML[0].children.length; i++) {
        const childElement = growthHTML[0].children[i];
        const previousElement = i > 0
            ? growthHTML[0].children[i - 1]
            : undefined
        const nextElement = i < growthHTML[0].children.length - 1
            ? growthHTML[0].children[i + 1]
            : undefined

        //childElement is the thing that should be replaced when all is said and done
        if (childElement.nodeName.toLowerCase() == 'sub-growth') {
            if (childElement.getAttribute('bordered') !== undefined && previousElement && (previousElement.nodeName.toLowerCase() != 'sub-growth' || previousElement.getAttribute('bordered') == !undefined)) {
                newGrowthCellHTML += "<growth-border double></growth-border>";
            }

            for (let j = 0; j < childElement.children.length; j++) {
                const nextSubElement = j < childElement.children.length - 1
                    ? childElement.children[j + 1]
                    : undefined
                
                writeGrowthNode(childElement.children[j], nextSubElement, childElement.title ? currentHeaderIndex : undefined);
            }
            if (childElement.title) {
                currentHeaderIndex++
            }
            
            if (childElement.getAttribute('bordered') !== undefined && nextElement) {
                newGrowthCellHTML += "<growth-border double></growth-border>";
            }

        } else {
            
            writeGrowthNode(childElement, nextElement);
        }

    }
    fullHTML += growthTitle + subTitle + newGrowthTableTagOpen + newGrowthCellHTML + newGrowthTableTagClose

    document.getElementsByTagName("growth")[0].removeAttribute("title");
    document.getElementsByTagName("growth")[0].innerHTML = fullHTML;

    function writeGrowthNode(childElement, nextElement, headerIndex) {
        const cost = childElement.getAttribute("cost");

        if (cost) {
            newGrowthCellHTML += `<growth-cost>-${cost}</growth-cost>`;
        }
		
		const tint = childElement.getAttribute("tint");
		let tint_text = ""
		if (tint) {
			tint_text += "<div class='tint' style='background-color:"+tint+";'></div>"
		}
		
        const growthClass = childElement.getAttribute("values");

        const classPieces = growthClass.split(';');
        const openTag = headerIndex !== undefined
            ? `<growth-cell header="${headerIndex}">`
            : "<growth-cell>"
        const closeTag = tint_text + '</growth-cell>'
		const terrains = new Set(['wetland', 'mountain', 'sand', 'jungle'])
					
        for (j = 0; j < classPieces.length; j++) {

            //Find a parenthesis and split out the string before it
            const growthItem = classPieces[j].split("(")[0];

            switch (growthItem) {
				// Simple growth items are handled in the 'Default' case. See function IconName.
				// Only growth items with options are handled here.
				case 'isolate': {
                        const matches = regExp.exec(classPieces[j])
						let isolateIcons = "{isolate}"
						let isolateText = "Isolate 1 of Your Lands"
						let isolateReqOpen = "";
						let isolateReqClose = "";
						if (matches){
							let isolateOptions = matches[1].split(",");
							let isolateRange = isolateOptions[0];
							isolateReqOpen = "<custom-icon>";
							isolateReqClose = "</custom-icon>";
							isolateIcons += "{range-" + isolateRange + "}";
							isolateText = "Isolate a Land";
						}
						newGrowthCellHTML += `${openTag}` + isolateReqOpen + isolateIcons + isolateReqClose + `<growth-text>`+isolateText+`</growth-text>${closeTag}`;
                        break;
				}
                case 'gain-energy': {
					const matches = regExp.exec(classPieces[j]);

					const gainEnergyBy = matches[1];
					let energyOptions = matches[1].split(",");
                    let energyManyIconOpen = "" 
					let energyManyIconClose = ""
					if (isNaN(energyOptions[0]) || energyOptions.length!=1) {
							energyManyIconOpen = "<growth-cell-double>"
							energyManyIconClose = "</growth-cell-double>"
					}
					let energyGrowthIcons = ""
					let energyGrowthText = ""
					if (!isNaN(energyOptions[0])) {
                        //Gain Energy has a number first
						let flatEnergy = energyOptions[0];
						energyGrowthIcons = "<growth-energy><value>" + flatEnergy + "</value></growth-energy>"
						if (energyOptions.length>1){
							// Flat energy + scaling
							scaling = energyOptions[1];
							energyGrowthIcons += "<gain-per><value>1</value></gain-per>"
							energyGrowthText = "Gain "+flatEnergy+" Energy and +1 Energy per "
							if (scaling==='text'){
								//determine some arbitrary scaling rule
								scaling_text = energyOptions[2] !== undefined ? energyOptions[2] : 'ENTER SCALING TEXT AS THIRD PARAMETER';
								energyGrowthIcons += "<gain-per-element><ring-icon><div class='custom-scaling'>!!!</div></ring-icon></gain-per-element>";
								energyGrowthText += scaling_text								
							}else{
								energyGrowthIcons += "<gain-per-element><ring-icon><icon class='" + scaling + "'></icon></ring-icon></gain-per-element>"
								energyGrowthText += Capitalise(scaling)
							}
						}else{
							// Flat energy
							energyGrowthText = "Gain Energy"								
						}
                    } else {
                        // Scaling
						scaling = energyOptions[0];						
						if (scaling==='text'){
							//determine some arbitrary scaling rule
							scaling_text = energyOptions[1] !== undefined ? energyOptions[1] : 'ENTER SCALING TEXT AS SECOND PARAMETER';
							energyGrowthIcons += "<gain-per><value>1</value></gain-per><gain-per-element><ring-icon><div class='custom-scaling'>!!!</div></ring-icon></gain-per-element>";
							energyGrowthText = "Gain 1 Energy per " + scaling_text								
						}else{
							energyGrowthIcons = "<gain-per><value>1</value></gain-per><gain-per-element><ring-icon><icon class='" + scaling + "'></icon></ring-icon></gain-per-element>"
							energyGrowthText = "Gain 1 Energy per " + Capitalise(scaling)
						}
                    }
					newGrowthCellHTML += `${openTag}` + energyManyIconOpen + energyGrowthIcons + energyManyIconClose + "<growth-text>" + energyGrowthText +"</growth-text>"+ `${closeTag}`
					break;
				}
				case 'add-presence': {
                    const matches = regExp.exec(classPieces[j]);

                    let presenceOptions = matches[1].split(",");
                    let presenceRange = presenceOptions[0];
                    let presenceReqOpen = "<custom-presence>";
                    let presenceReqClose = "</custom-presence>";
                    let presenceReq = "none";
                    let presenceText = "";
                    let presenceIcon = "";
                    let presenceTextLead = "";
                    let presenceTextEnd = "";

					if (presenceRange=='any' && presenceOptions.length==1) {

						presenceReqOpen = "<custom-presence-no-range>";
						presenceReqClose = "</custom-presence-no-range>";
						presenceText = " to any Land"
					} else if (presenceOptions.length > 1) {
                        presenceReqOpen = "<custom-presence-req>";
                        presenceReqClose = "</custom-presence-req>";
                        presenceIcon += "<presence-req>";
                        
						if (presenceRange=='any'){
							presenceReqOpen += "<presence-req></presence-req>"
						}
						
                        if(presenceOptions[1]=='text'){
                            // User wants a custom text presence addition
                            presenceIcon += "<span style='font-family: DK Snemand; font-size: 24pt; font-style: normal;'>!!!</span>";
							presenceText += presenceOptions[2];
                        } else if (presenceOptions[1]=='token'){
                            // User wants to add a token in growth
                            switch (presenceOptions[3]){
                                    case 'and':
                                        //add presence and token
                                        presenceIcon += "<span class='plus-text'>+ </span>";
                                        presenceIcon += "{"+presenceOptions[2]+"}";
                                        presenceText += " and a " + Capitalise(presenceOptions[2]);
                                        break;
                                    case 'or':
                                        //add presence or token
                                        presenceIcon += "<span class='plus-text'>or </span>";
                                        presenceIcon += "{"+presenceOptions[2]+"}";
                                        presenceText += " or a " + Capitalise(presenceOptions[2]);
                                    case 'instead':
                                        //no option to add presence, just token
                            }
                        } else {
                            // User wants an OR or an AND requirement
                            let operator = "";
                            if (presenceOptions.length > 4) {
                                operator = "/";
                            }else{
                                operator = " "+presenceOptions.at(-1)+" ";
                            }
                            
                            presenceText += " to ";
							presenceText += presenceRange === 'any' ? 'any ' : '';
							
                            let flag = 0; // This flag is used to figure out if 'land with' has been said already. It comes up with add-presence(3,jungle,beasts,or)
							let and_flag = 0;
                            for (var i = 1; i < presenceOptions.length; i++) {
                                
                                // Check to see if we've reached an 'or', which shouldn't be parsed
                                presenceReq = presenceOptions[i];
                                if (presenceReq === 'or' || presenceReq === 'and') {
                                    break;
                                }
                                
                                // Icons
                                switch (presenceReq){
                                    case 'inland':
                                    case 'coastal':
                                    case 'invaders':
                                        presenceIcon += presenceOptions.length < 3
                                            ? "<span class='non-icon'>"+presenceReq.toUpperCase()+"</span><icon style='height:50px; width:0px;'></icon>" // This do-nothing Icon just creates 50px of height to make everything line up. Other ideas?
                                            : "<span class='non-icon small'>"+presenceReq.toUpperCase()+"</span><icon style='height:50px; width:0px;'></icon>"
                                        break;
                                        
                                    default:
                                        presenceIcon += "{"+presenceReq+"}";
                                }

                                if (i < presenceOptions.length - 2) {
                                    presenceIcon += operator;
                                }
                                
                                // Text
                                multiLandCheck = presenceReq.split("-");
                                if (terrains.has(multiLandCheck[1])){
                                    multiLandText = Capitalise(multiLandCheck[0]) + " or " + Capitalise(multiLandCheck[1]);
                                    presenceReq = 'multiland';
                                }
                                
                                presenceTextLead = "";
                                presenceTextEnd = "";
                                
                                switch (presenceReq){
                                    case 'sand':
                                    case 'mountain':
                                    case 'wetland':
                                    case 'jungle':
                                    case 'ocean':
                                        presenceText += i != 1 ? operator : "";
                                        presenceText += Capitalise(presenceReq);
										and_flag = 1;
                                        break;
                                    case 'inland':
                                    case 'coastal':
                                        presenceText += i != 1 ? operator : "";
                                        presenceText += Capitalise(presenceReq) + " land";
                                        break;
                                    case 'multiland':
                                        presenceText += multiLandText;
										and_flag = 1;
                                        break;
                                    case 'no-blight':
                                        presenceText += i == 1 ? " Land without " : " and no ";
                                        presenceText += "Blight";
                                        break;
                                    case 'beast':
                                        presenceTextEnd = "s"
                                    case 'presence':
                                        presenceTextLead += presenceTextEnd==="" ? "Your " : "";
                                        //Intentionally do not break.
                                    default:
                                        if (flag == 0 && i != 1 && operator != ' and ') {
                                            presenceText += operator+"Land with ";
                                        }else if(flag == 0 && operator != ' and '){
                                            presenceText += " Land with ";
                                        }else{
											if(operator === ' and ' && flag !== 1){
												presenceText += (and_flag===1) ? ' with ' : ' Land with ';
											}else{
												presenceText += operator;
											}
                                        }
                                        flag = 1;
                                        presenceText += presenceTextLead + Capitalise(presenceReq) + presenceTextEnd;
                                }
                            }                            
                        }
                        presenceIcon += "</presence-req>";
					}

                    newGrowthCellHTML += `${openTag}` + presenceReqOpen + "+{presence}" + presenceIcon + "{range-" + presenceRange + "}" + presenceReqClose + "<growth-text>Add a Presence" + presenceText + `</growth-text>${closeTag}`
                    break;
                }
                case 'push':
                case 'gather': {
					const matches = regExp.exec(classPieces[j]);
					
					let preposition = growthItem=='push'
						? 'from'
						: 'into'
					
					let moveText = ""
					let moveIcons = `${openTag}`
					let moveTarget = matches[1];
					let moveOptions = matches[1].split(",");
					let moveRange = moveOptions[1];
					let moveNum = moveOptions[2];
					let plural = "";
					if(!moveNum){
						moveNum = 1;
					}else if(isNaN(moveNum)){
						moveNum = moveNum.toUpperCase();
					}else{
						plural = moveNum > 1 ? "s" : "";
					}
					if(moveRange){
						moveTarget = moveOptions[0];
						if(isNaN(moveRange)){
							let moveCondition = moveRange;
							// Gather/Push into/from a sacred site, land with token, or terrain
							
							// Text
							moveText += "<growth-text>"+Capitalise(growthItem)+" 1 " + Capitalise(moveTarget) +" "+ preposition + " " + moveNum;
							switch (moveCondition){
								case 'sacred-site':
									moveText += " of your Sacred Sites"
									moveIcons += "<push-gather><icon class='" + growthItem + "-" + preposition + "'><icon class='" + moveTarget + "'></icon><icon class='" + preposition + " " + moveCondition + "'></icon></icon></push-gather>"
									break;
								case 'wetland':
								case 'sand':
								case 'mountain':
								case 'jungle':
								case 'jungle-wetland':
								case 'jungle-sand':
								case 'jungle-mountain':
								case 'sand-wetland':
								case 'mountain-wetland':
								case 'mountain-sand':
								case 'mountain-jungle':
								case 'sand-jungle':
								case 'sand-mountain':
								case 'wetland-jugnle':
								case 'wetland-mountain':
								case 'wetland-sand':
								case 'ocean':
									moveIcons += "<push-gather><icon class='" + moveCondition + " terrain-"+growthItem+"'>{"+growthItem+"-arrow}<icon class='" + moveTarget + " "+preposition+"'></icon></icon></push-gather>"
									moveText += " " + Capitalise(moveCondition) + plural
									break;
								default:
									moveText += " of your Lands with " + Capitalise(moveCondition)
									moveIcons += "<push-gather><icon class='" + growthItem + "-" + preposition + "'><icon class='" + moveTarget + "'></icon><icon class='" + preposition + " " + moveCondition + "'></icon></icon></push-gather>"
							}
							moveText += `</growth-text>${closeTag}`
						}else{
						// Gather/Push at range
							moveIcons += "<push-gather-range-req><icon class='" + growthItem + "'><icon class='" + moveTarget + "'></icon></icon>"+"{range-" + moveRange + "}</push-gather-range-req>"
							moveText += "<growth-text>"+Capitalise(growthItem)+" up to 1 " + Capitalise(moveTarget)+" " + preposition + ` a Land</growth-text>${closeTag}`
						}
					}else{
						moveIcons += "<push-gather><icon class='" + growthItem + "'><icon class='" + moveTarget + "'></icon></icon></push-gather>"
						moveText += "<growth-text>"+Capitalise(growthItem)+" 1 " + Capitalise(moveTarget)+" " + preposition + ` 1 of your Lands</growth-text>${closeTag}`
					}
					newGrowthCellHTML += moveIcons + moveText;
					break;
				}
                case 'presence-no-range': {
					//This is potentially redundant.
					newGrowthCellHTML += `${openTag}<custom-presence-no-range>+{presence}</custom-presence-no-range><growth-text>Add a Presence to any Land</growth-text>${closeTag}`
					break;
				}
                case 'move-presence': {        
					//Additional things can be done here based on inputs
					const matches = regExp.exec(classPieces[j]);

					const moveRange = matches[1];
					newGrowthCellHTML += `${openTag}<custom-presence>{presence}{move-range-` + moveRange + `}</custom-presence><growth-text>Move a Presence</growth-text>${closeTag}`

					break;
				}
                case 'gain-element': {
					const matches = regExp.exec(classPieces[j]);

					const gainedElement = matches[1];

					const elementOptions = matches[1].split(",");

					//Check if they want 2 elements (multiple of the same element, and OR between multiple elements are implemented. AND is not)
					if (elementOptions.length > 1) {
						
						//Check if they want multiples of the same element or a choice of elements by looking for a numeral
						if (isNaN(elementOptions[1]) && elementOptions.at(-1) !== 'and') {
							//No numeral - user wants different elements. For example gain-element(water,fire)
							if (elementOptions.at(-1) === 'or' || elementOptions.at(-1) === 'and'){}
					
							//Icons
							newGrowthCellHTML += `${openTag}<gain class='or'>`
							for (var i = 0; i < elementOptions.length; i++) {
								newGrowthCellHTML += "<icon class='orelement " + elementOptions[i] + "'></icon>";
								if (i < elementOptions.length - 1) {
									newGrowthCellHTML += "{backslash}";
								}
							}
							//Text
							newGrowthCellHTML += "</gain><growth-text>Gain ";
							for (var i = 0; i < elementOptions.length; i++) {
								newGrowthCellHTML += Capitalise(elementOptions[i]);
								if (i < elementOptions.length-2) {
									newGrowthCellHTML += ", ";
								} else if (i == elementOptions.length-2) {
									newGrowthCellHTML += " or ";
								}
							}
							newGrowthCellHTML += `</growth-text>${closeTag}`;
								
						} else { 
							// Gain multiple of the same element or gain multiple different elements (all of them, not or)

							let numLocs                                
							// Text
							let elementText = "";
							if (elementOptions.at(-1) == 'and'){
								// gain multiple different elements
								numLocs = elementOptions.length - 1;
								for (var i = 0; i < numLocs; i++) {
									elementText += Capitalise(elementOptions[i]);
									if (i < numLocs-2) {
										elementText += ", ";
									} else if (i == numLocs-2) {
										elementText += " and ";
									}
								}
							} else {
								// gain multiple of the same element
								numLocs = elementOptions[1];
								elementText = elementOptions[1] +" "+ Capitalise(elementOptions[0]);
							}
							
							// Icons
							let rad_size = 20 + 5*(numLocs-2); // this expands slightly as more icons are used
							var elementIcons = ""
							for (var i = 0; i < numLocs; i++) {
								pos_angle = i * 2*Math.PI / numLocs - (Math.PI)*(1-(1/6));
								x_loc = rad_size * Math.cos(pos_angle) - 30;
								y_loc = rad_size * Math.sin(pos_angle) - 20;
								let element_loc = "style='transform: translateY("+y_loc+"px) translateX("+x_loc+"px)'";
								let cur_element = elementOptions.at(-1) === 'and'
									? elementOptions[i]
									: elementOptions[0]
								console.log(cur_element)
								elementIcons += "<icon-multi-element><icon class='"+cur_element+"'"+element_loc+"></icon></icon-multi-element>"
							}
							elementIcons += "<icon style='width:0px;height:99px'></icon>"; // This is a filler icon to make sure the spacing is right. Any idea for a better solution?
							
							newGrowthCellHTML += `${openTag}<gain>` + elementIcons + "</gain><growth-text>Gain "+elementText+`</growth-text>${closeTag}`;
						}
								
					} else {
						let elementText = ""
						elementText = gainedElement==='star' ? 'Element' : Capitalise(gainedElement)
						newGrowthCellHTML += `${openTag}<gain>{` + gainedElement + "}</gain><growth-text>Gain " + elementText + `</growth-text>${closeTag}`
					}
					break;
				}
                case 'custom': {
					const matches = regExp.exec(classPieces[j]);
					let customOptions = matches[1].split(",");
					customIcon = customOptions[1];
					customText = customOptions[0];
					if (customIcon){
						customIcon = "{" + customIcon + "}";
					}else{
						customIcon = "<div class='custom-scaling'>!!!</div>";
					}
					newGrowthCellHTML += `${openTag}<custom-growth-icon>`  + customIcon + `</custom-growth-icon><growth-text>`+customText+`</growth-text>${closeTag}`;
					break;
				}
				case 'fear': {
					// WORKIN PROGRESS
					const matches = regExp.exec(classPieces[j]);

					let fearOptions = matches[1].split(",");
                    let fearManyIconOpen = "" 
					let fearManyIconClose = ""
					if (isNaN(fearOptions[0]) || fearOptions.length!=1) {
							fearManyIconOpen = "<growth-cell-double>"
							fearManyIconClose = "</growth-cell-double>"
					}
					let fearGrowthIcons = ""
					let fearGrowthText = ""
					if (!isNaN(fearOptions[0])) {
                        //Generate Fear has a number first
						let flatFear = fearOptions[0];
						fearGrowthIcons = "<growth-fear><value>" + flatFear + "</value></growth-fear>"
						if (fearOptions.length>1){
							// Flat fear + scaling
							scaling = fearOptions[1];
							fearGrowthIcons += "<fear-per><value>1</value></fear-per>"
							fearGrowthText = "Generate "+flatFear+" Fear and +1 Fear per "
							if (scaling==='text'){
								//determine some arbitrary scaling rule
								scaling_text = fearOptions[2] !== undefined ? fearOptions[2] : 'ENTER SCALING TEXT AS THIRD PARAMETER';
								fearGrowthIcons += "<gain-per-fear><ring-icon><div class='custom-scaling'>!!!</div></ring-icon></gain-per-fear>";
								fearGrowthText += scaling_text								
							}else{
								fearGrowthIcons += "<gain-per-fear><ring-icon><icon class='" + scaling + "'></icon></ring-icon></gain-per-fear>"
								fearGrowthText += Capitalise(scaling)
							}
						}else{
							// Flat fear
							fearGrowthText = "Generate Fear"								
						}
                    } else {
                        // Scaling
						scaling = fearOptions[0];						
						if (scaling==='text'){
							//determine some arbitrary scaling rule
							scaling_text = fearOptions[1] !== undefined ? fearOptions[1] : 'ENTER SCALING TEXT AS SECOND PARAMETER';
							fearGrowthIcons += "<gain-per><value>1</value></gain-per><gain-per-fear><ring-icon><div class='custom-scaling'>!!!</div></ring-icon></gain-per-fear>";
							fearGrowthText = "Generate 1 Fear per " + scaling_text								
						}else{
							fearGrowthIcons = "<gain-per><value>1</value></gain-per><gain-per-fear><ring-icon><icon class='" + scaling + "'></icon></ring-icon></gain-per-fear>"
							fearGrowthText = "Generate 1 Fear per " + Capitalise(scaling)
						}
                    }
					newGrowthCellHTML += `${openTag}` + fearManyIconOpen + fearGrowthIcons + fearManyIconClose + "<growth-text>" + fearGrowthText +"</growth-text>"+ `${closeTag}`
					break;
				}
				case 'gain-card-play': {
					const matches = regExp.exec(classPieces[j]);
					
					if(matches){
						let cardplayOptions = matches[1].split(",");
						num_card_plays = cardplayOptions[0];
						newGrowthCellHTML += `${openTag}<card-play-num><value>` + num_card_plays + "</value></card-play-num><growth-text> Gain "+num_card_plays+" Card Plays"+`</growth-text>${closeTag}`
					}else{
						newGrowthCellHTML += `${openTag}{`+growthItem+`}<growth-text>`+IconName(growthItem)+`</growth-text>${closeTag}`
					}
					break;
				}
				default:
					newGrowthCellHTML += `${openTag}{`+growthItem+`}<growth-text>`+IconName(growthItem)+`</growth-text>${closeTag}`

            }
        }

        if (nextElement && nextElement.nodeName.toLowerCase() == 'growth-group') {
            newGrowthCellHTML += headerIndex !== undefined
                ? `<growth-border header="${headerIndex}"></growth-border>`
                : "<growth-border></growth-border>";
        }

    }
}

function parseEnergyTrackTags(){
    
    var energyValues = document.getElementsByTagName("energy-track")[0].getAttribute("values");
    var energyOptions = energyValues.split(",");

    var energyBanner = document.getElementsByTagName("energy-track")[0].getAttribute("banner");
    var energyBannerScale = document.getElementsByTagName("energy-track")[0].getAttribute("banner-v-scale");
    var energyHTML = "";
    
    //Determine the length of the energy track
    //If for some reason the width of a presence track spot changes, this needs to be updated. Ideas for automating?
    let energyLength = energyOptions.length * 130 + 15;
    if(energyBanner){
        energyHTML = "<tr style='background-image:  url("+energyBanner+"); background-size: "+energyLength+"px "+energyBannerScale+"; background-repeat: no-repeat; background-position: left 0px top 20px;'>"
    } else {
        energyHTML = "<tr>";
    }
    
    // This can be scaled to move the first presence icon. 
    energyHTML += "<td style='width:10px'></td>"

    for(i = 0; i < energyOptions.length; i++){
        energyHTML += "<td>"+getPresenceNodeHtml(energyOptions[i], i == 0, "energy", true)+"</td>";
    }
    energyHTML += "</tr>"
    document.getElementsByTagName("energy-track")[0].removeAttribute("values");
    return energyHTML;
    
}

function parseCardPlayTrackTags(){    
    
    var cardPlayValues = document.getElementsByTagName("card-play-track")[0].getAttribute("values");
    var cardPlayOptions = cardPlayValues.split(",");
	console.log("cardPlayOptions: "+cardPlayOptions)
    var cardPlayBanner = document.getElementsByTagName("card-play-track")[0].getAttribute("banner");
    var cardPlayBannerScale = document.getElementsByTagName("card-play-track")[0].getAttribute("banner-v-scale");
    if(!cardPlayBannerScale){
        cardPlayBannerScale = "100%"
    }
    var cardPlayHTML = "";
    
    //Determine the length of the energy track
    //If for some reason the width of a presence track spot changes, this needs to be updated. Ideas for automating?
    let cardPlayLength = cardPlayOptions.length * 130 + 15;
    if(cardPlayBanner){
        cardPlayHTML = "<tr style='background-image:  url("+cardPlayBanner+"); background-size: "+cardPlayLength+"px "+cardPlayBannerScale+"; background-repeat: no-repeat; background-position: left 0px top 20px;'>"
    } else {
        cardPlayHTML = "<tr>";
    }
    
    // This can be scaled to move the first presence icon.
    cardPlayHTML += "<td style='width:10px'></td>"

    for(i = 0; i < cardPlayOptions.length; i++){
        cardPlayHTML += "<td>"+getPresenceNodeHtml(cardPlayOptions[i], i == 0, "card", false)+"</td>";
    }
    cardPlayHTML += "</tr>"    
    document.getElementsByTagName("card-play-track")[0].removeAttribute("values");
    return cardPlayHTML;    
}

function enhancePresenceTracksTable() {
    var elmt = document.getElementsByTagName("presence-tracks")[0];
    var title = document.createElement("section-title");
    title.innerHTML = "Presence";    
    elmt.insertBefore(title, elmt.firstChild); 
    
    var table = document.getElementById("presence-table");
    for (var i = 0, row; row = table.rows[i]; i++) {
       for (var j = 0, cell; cell = row.cells[j]; j++) {
        cell.innerHTML = getPresenceNodeHtml(cell.firstChild.nodeValue, j == 0, 'dynamic', i == 0);
       }  
    }
}

function getPresenceNodeHtml(nodeText, first, trackType, addEnergyRing) {
    var result = '';
    
    //Find values between parenthesis
    var regExp = /\(([^)]+)\)/;    

    var nodeClass = '';

    // Every node will have a presence-node element with
    // a ring-icon element inside, so we can add these now.
    presenceNode = document.createElement("presence-node");    
    ring = document.createElement("ring-icon");
    presenceNode.appendChild(ring);
    // Will be populated with the sub text that will be added at the end
    var subText = '';
    // Will be populated with the raw HTML that will go inside the ring-icon element.
    var inner = "";

    if(trackType == 'dynamic'){
        if(nodeText.startsWith("energy")) {
            nodeText = nodeText.substr(6);
            nodeClass = 'energy';
            subText = 'Energy/Turn';
        }
        else if(nodeText.startsWith("card")) {
            nodeText = nodeText.substr(4);
            nodeClass = 'card';
            subText = 'Card Plays';
        }
    }
    else if(trackType == 'energy'){
        nodeClass = 'energy';
        subText = 'Energy/Turn';
    }
    else if(trackType == 'card'){
        nodeClass = 'card';
        subText = 'Card Plays';
    }

    
    if(!isNaN(nodeText)){
        //The value is only a number
        addEnergyRing = false;
        if(first === true){
            presenceNode.classList.add("first");
        } else {
            subText = nodeText;
        }
        inner = "<" + nodeClass + "-icon><value>" + nodeText + "</value></" + nodeClass + "-icon>";
    } else {
        //It is either a single element or a mix of elements/numbers
        var splitOptions = nodeText.split("+");
		console.log("nodetext:"+nodeText)
        if(splitOptions.length == 1){
            //It's just a single item
            var option = splitOptions[0].split("(")[0];
			console.log(splitOptions[0]+" > "+option + " > " + splitOptions)
            switch(option){
				case 'push':
                    var matches = regExp.exec(splitOptions[0]);
                    var moveTarget = matches[1];
                    inner = "<icon class='push'><icon class='"+moveTarget+"'></icon></icon>";
                    subText = "Push 1 "+Capitalise(moveTarget) + " from 1 of your Lands";
                    break;    
                case 'gather':
                    var matches = regExp.exec(splitOptions[0]);
					console.log(matches)
                    var moveTarget = matches[1];
                    inner = "<icon class='gather'><icon class='"+moveTarget+"'></icon></icon>";
                    subText = "Gather 1 "+Capitalise(moveTarget) + " into 1 of your Lands";
                    break;
				case 'custom':
                    var matches = regExp.exec(splitOptions[0]);
                    var custom_node = matches[1].split(";");
					var custom_text = custom_node[0];
					if(custom_node[1]){
						inner = "{"+custom_node[1]+"}";
					}else{
						inner = "<" + nodeClass + "-icon><value>!!!</value></" + nodeClass + "-icon>";
					}
					subText = custom_text
					break;
				case 'move-presence':
                    var matches = regExp.exec(splitOptions[0]);
                    var moveRange = matches[1];
                    inner = "{move-presence-"+moveRange+"}";
                    subText = "Move a Presence "+moveRange;
                    break;
				case 'gain-card-play':
					var matches = regExp.exec(splitOptions[0]);
					cardplay_text = splitOptions[0]
					cardplay_icon = splitOptions[0]
					console.log(matches)
					if(matches){
						var cardplay_node = matches[1].split(";");
						var cardplay_text = cardplay_node[0];
						console.log(matches+ " " +cardplay_node + " " +cardplay_text)
						inner = "<icon class='"+option+" deep-layers'><icon class='minor'></icon></icon>";
					}else{
						inner = "<icon class='"+cardplay_text+"'></icon>";
					}
					subText = "+1 Card Play/Turn"
					break;
                default:
                    var iconText = splitOptions[0];
                    inner = "<icon class='"+iconText+"'></icon>";
                    subText = IconName(iconText);
                    break;                
            }            
        } else {
            var subText = ""
            
            //Prepare text. First, check if multiple of the same icon (ie. 2 Water)
            if (splitOptions.every( (val, i, arr) => val === arr[0] )) {
                subText = splitOptions.length + " " + Capitalise(splitOptions[0]);
            } else {
                for (var i = 0; i < splitOptions.length; i++) {
					subText += IconName(splitOptions[i]);
					
                    if(i < splitOptions.length-1){
                        subText += ", "
                    }
                }
            }
        
            numLocs = splitOptions.length;
            let rad_size = 20 + 1*numLocs; // this expands slightly as more icons are used
            var trackIcons = ""
            for (var i = 0; i < numLocs; i++) {
                pos_angle = i * 2*Math.PI / numLocs - (Math.PI)*(1-(1/6));
                x_loc = rad_size * Math.cos(pos_angle) - 33;
                y_loc = rad_size * Math.sin(pos_angle) - 25;
                let track_icon_loc = "style='transform: translateY("+y_loc+"px) translateX("+x_loc+"px)'";

                // deal with cards and energy
                if(!isNaN(splitOptions[i])){
                    trackIcons += "<icon-multi-element><" + nodeClass + "-icon class='small'"+track_icon_loc+"><value>" + splitOptions[i] + "</value></" + nodeClass + "-icon></icon-multi-element>";
                    if(nodeClass == 'energy') { 
                        addEnergyRing = false;
                    }
                } else if(splitOptions[i].startsWith("reclaim")){
                    trackIcons += "<icon-multi-element><icon class='"+splitOptions[i]+" small-reclaim'"+track_icon_loc+"></icon></icon-multi-element>"
                } else if(splitOptions[i].startsWith("move-presence")){
					console.log("check here " + splitOptions[i])
					var matches = regExp.exec(splitOptions[i]);
                    var moveRange = matches[1];
					console.log(moveRange)
                    trackIcons += "<icon-multi-element><icon class='move-presence-"+moveRange+" small'"+track_icon_loc+"'></icon></icon-multi-element>"
				} else {
                    trackIcons += "<icon-multi-element><icon class='"+splitOptions[i]+"'"+track_icon_loc+"></icon></icon-multi-element>"
                }
            }
            var inner = trackIcons;
        }
    }
        
    if(addEnergyRing){ inner = "<energy-icon>"+inner+"</energy-icon>"; }
    ring.innerHTML = inner;
    presenceNode.innerHTML += "<subtext>" + subText + "</subtext>";
    
    return presenceNode.outerHTML;
}

function IconName(str){
	console.log(str)
	num = str.split("(")[1];
	str = str.split("(")[0];
	
	console.log(">"+str+" "+num)
	switch(str){

		case 'gain-power-card':
			subText = "Gain Power Card"
			break;
		case 'gain-card-play':
			subText = "Gain a Card Play"
			break;
		case 'reclaim-all':
			subText = "Reclaim All"
			break;
		case 'reclaim-one':
			subText = "Reclaim One";
			break;
		case 'forget-power-card':
			subText = "Forget Power Card";
			break;    
		case 'discard-cards':
			subText = "Discard 2 Power Cards"
			break;
		case 'destroy-presence':
			subText = "Destroy 1 of your Presence"
			break;
		case 'make-fast':  
			subText = "One of your Powers may be Fast"
			break;
		case 'forget-power-card':
			subText = "Forget Power";
			break;    
		case 'gain-card-pay-2':
			subText = "Pay 2 Energy to Gain a Power Card";
			break;
		case 'ignore-range':
			subText = "You may ignore Range this turn"
			break;
		case 'star':
			subText = "Element"
			break;
		case 'markerplus':
			subText = "Gain 1 Element Marker";
			break;
		case 'markerminus':
			subText = "Pay 1 Element Marker";
			break;
		case 'isolate':
			subText = "Isolate 1 of your Lands";
			break;
		case 'reclaim-none':
			subText = "Reclaim None"
			break;
		case 'move-presence':
			subText = "Move Presence " + num[0];
			break;
		case 'inland':
		case 'coastal':
		case 'invaders':
			subText = str.toUpperCase();
			break;
		default:
			subText = Capitalise(str);
			break;                
	}
	
	return subText

}

function Capitalise(str){
	hyphenCheck = str.split("-");
	const terrains = new Set(['wetland', 'mountain', 'sand', 'jungle'])
	let return_str = hyphenCheck[0].charAt(0).toUpperCase() + hyphenCheck[0].slice(1);
	for (var i = 1; i < hyphenCheck.length; i++) {
		if (terrains.has(hyphenCheck[i])){
			return_str += ' or ';
		}else{
			return_str += ' ';
		}		
		return_str += hyphenCheck[i].charAt(0).toUpperCase() + hyphenCheck[i].slice(1);
	}		

    return return_str;
}

function setNewEnergyCardPlayTracks(energyHTML, cardPlayHTML){
    document.getElementsByTagName("presence-tracks")[0].innerHTML = "<section-title>Presence</section-title>" +
        "<table id='presence-table'>"+energyHTML + cardPlayHTML+"</table>";
}

function dynamicCellWidth() {
    growthCells =  document.getElementsByTagName("growth-cell");
    growthCellCount = growthCells.length;

    growthBorders = Array.from(document.getElementsByTagName("growth-border"));
    growthBorderCount = growthBorders.length;

    /* Borders = 7px */
    /* Table width: 1050px */

    let borderPixels = 0;
    for (const borderWidth of growthBorders.map(x => x.getAttribute('double') === undefined ? 7 : 11)) {
        borderPixels += borderWidth
    }

    const growthTable = document.getElementsByTagName("growth-table")[0];
    const growthTableStyle = window.getComputedStyle(growthTable);
    const growthTableWidth = growthTableStyle.getPropertyValue('width');

    const remainingCellWidth = (parseInt(growthTableWidth.replace(/px/, "")) - borderPixels) + "px";
    const equalCellWidth = (parseFloat(remainingCellWidth.replace(/px/, "")) / growthCellCount) + "px";

    for (i = 0; i < growthCells.length; i++){
        growthCells[i].style.width = equalCellWidth;
    }

    const headerWith = {}
    const headerAdditionalWidth = {}
    let maxIndex = undefined
    for (const c of growthTable.children) {
        const header = parseInt(c.getAttribute('header'))
        if (!isNaN( header )) {
            maxIndex = header
            const addwith = parseFloat(window.getComputedStyle(c).getPropertyValue('margin-right').replace(/px/, ""))
                + parseFloat(window.getComputedStyle(c).getPropertyValue('margin-left').replace(/px/, ""))
                + parseFloat(window.getComputedStyle(c).getPropertyValue('width').replace(/px/, ""))

            if (headerWith[header]) {
                headerWith[header] += addwith
            } else {
                headerWith[header] = addwith
            }
        } else if (maxIndex != undefined) {
            const addwith = parseFloat(window.getComputedStyle(c).getPropertyValue('margin-right').replace(/px/, ""))
                + parseFloat(window.getComputedStyle(c).getPropertyValue('margin-left').replace(/px/, ""))
                + parseFloat(window.getComputedStyle(c).getPropertyValue('width').replace(/px/, ""))
            if (headerAdditionalWidth[maxIndex]) {
                headerAdditionalWidth[maxIndex] += addwith
            } else {
                headerAdditionalWidth[maxIndex] = addwith
            }

        }
    }


    const subGrowthTitle = document.getElementsByTagName('sub-section-title')
    let position = 0
    for (let i = 0; i < subGrowthTitle.length; i++) {
        subGrowthTitle[i].style.left = `${position}px`
        subGrowthTitle[i].style.width = `${headerWith[i]}px`
        position += headerWith[i] + headerAdditionalWidth[i]

        
    }


    thresholds = document.getElementsByTagName("threshold");
    thresholdsCount = thresholds.length;
    ICONWIDTH = 60;

    for (i = 0; i < thresholdsCount; i++){
        icon = thresholds[i].getElementsByTagName("icon");

        iconCount = icon.length;

        dynamicThresholdWidth = 
            (iconCount * ICONWIDTH) + (iconCount * 12);
        formattedWidth = dynamicThresholdWidth + "px";
        thresholds[i].style.width = formattedWidth;
        
    }
    var description = document.getElementsByClassName("description");
    for(i = 0; i < description.length; i++){
        
        var textHeight = description[i].clientHeight;

        //Get the icon width and add it to length
        if (textHeight < 40){
            description[i].id = "single-line";
        }
    }
    
    // Presence node subtext (for longer descriptions, allows flowing over into neighbors.
    var subtext = document.getElementsByTagName("subtext");
    for(i = 0; i < subtext.length; i++){
        
        var textHeight = subtext[i].clientHeight;
        
        //This solution is really jank, but it works for now
        if (textHeight > 60){
            subtext[i].style.width = "148px";
            subtext[i].style.position = "absolute";
            subtext[i].style.transform = "translateX(-14px)";
        }
    }
    
}

function parseInnatePowers(){
    var fullHTML = "";
    
    var innateHTML = document.getElementsByTagName("quick-innate-power");
    
    for(i = 0; i < innateHTML.length; i++){
        fullHTML += parseInnatePower(innateHTML[i]);
    }
    document.getElementsByTagName("innate-powers")[0].innerHTML = '<section-title>Innnate Powers</section-title><innate-power-container>'+fullHTML+'</innate-power-container>';
}

function parseInnatePower(innatePowerHTML){

    var currentPowerHTML = "<innate-power class='"+innatePowerHTML.getAttribute("speed")+"'>";
    
    //Innater Power title
    currentPowerHTML += "<innate-power-title>"+innatePowerHTML.getAttribute("name")+"</innate-power-title><info-container><info-title>";
    
    //Innate Power Speed and Range Header
    currentPowerHTML += "<info-title-speed>SPEED</info-title-speed><info-title-range>RANGE</info-title-range>";
    
    //Innate Power Target Header
    currentPowerHTML += "<info-title-target>"+innatePowerHTML.getAttribute("target-title")+"</info-title-target></info-title><innate-info>";
    
    //Innater Power Speed value
    currentPowerHTML += "<innate-info-speed></innate-info-speed>";
    
    //Innate Power Range value
    currentPowerHTML += `<innate-info-range>${getRangeModel(innatePowerHTML.getAttribute("range"))}</innate-info-range>`;

    function getRangeModel(rangeString)
    {
      if(rangeString === "none"){
        return "<no-range></no-range>";
      }else {
        var result = '';
        for(var item of rangeString.split(',')){
          if(!isNaN(item)){
            result += `<range>${item}</range>`;
          }
          else
          {
            result += `<icon class="${item}"></icon>`;
          }
        }
        return result;
      }
    }
    
    //Innate Power Target value
    var targetValue = innatePowerHTML.getAttribute("target");
    currentPowerHTML += `<innate-info-target>${replaceIcon(targetValue)}</innate-info-target></innate-info></info-container>`;
    
    /*console.log(targetValue);
    var specialLandsList = ["any", "coastal", "invaders", "inland"];

    if(specialLandsList.includes(targetValue.toLowerCase())){
        targetValue = targetValue.toUpperCase();
        currentPowerHTML += "<innate-info-target>"+targetValue+"</innate-info-target></innate-info></info-container>";
    } else {
        currentPowerHTML += "<innate-info-target>{"+targetValue+"}</innate-info-target></innate-info></info-container>";
    }*/

    currentPowerHTML += "<description-container>";
    
    var noteValue = innatePowerHTML.getAttribute("note");

    //If the note field is blank
    if(noteValue == null){
        noteValue = "";
    }else{
        currentPowerHTML += "<note>" + noteValue + "</note>";
    }       


    //Innate Power Levels and Thresholds
    var currentLevels = innatePowerHTML.getElementsByTagName("level");
    for (j = 0; j < currentLevels.length; j++){
        var currentThreshold = currentLevels[j].getAttribute("threshold");
        var currentThresholdPieces = currentThreshold.split(",");
      
        currentPowerHTML += "<level><threshold>";
        for (k = 0; k < currentThresholdPieces.length; k++){
            currentThresholdPieces[k] = currentThresholdPieces[k].replace("-","{");
            currentThresholdPieces[k] += "}";
            currentPowerHTML += currentThresholdPieces[k];
        }
        currentPowerHTML += "</threshold><div class='description'>";
        var currentDescription = currentLevels[j].innerHTML;
        currentPowerHTML += currentDescription+"</div></level>";
    }
    
    currentPowerHTML+="</description-container></innate-power>";
    return currentPowerHTML;
}


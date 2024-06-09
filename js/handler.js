//	when mousedown the filename
function handleFileClick({ profile, filename }){
    //	clear html content
    $("#filename").html("");
    $(`#file-content-${filename}`).html("");

    //	hidden all the typed cursor blink
    $(".typed-cursor").addClass("d-none");

    //	remove all "vs-file-active" class from "profile.files"
    for(const section in profile.files)
        $(`#file-${section}`).removeClass("vs-file-active");
    //	add "vs-file-active" class to current "this" element
    $(`#file-${filename}`).addClass("vs-file-active");

    //	add all "d-none" class to "profile.files"
    for(const section in profile.files)
        $(`#file-content-${section}`).addClass("d-none");
    //	remove "d-none" class to current "this" element
    $(`#file-content-${filename}`).removeClass("d-none");
    
    let new_index = profile.checkActiveIndex(filename);
    
    //	if the new_index not exist, default show latest file
    if(new_index === -1){
        new_index = profile.getActiveIndex();
        filename = profile.getActiveSection(new_index);
    }
    
    profile.setActiveIndex(new_index);
    profile.activeSection(filename);
}

//	when dragging the filename
function handleFileMoving({ profile, files_id, this_id }){
    //	get the moving position index
    const getPositionIndex = (moving_x, files_position = []) => {
        let position_index = 0;
        let border_index = 0;
        
        for(let i=0; i<files_position.length; i++){
            const { x, mid, width } = files_position[i];

            //  moving across current file, jump to next index 
            if(moving_x > (x + width))
                //  limit to length of array - 1 (most right side)
                position_index = Math.min(i + 1, files_position.length - 1);
            //  moving more than half will show right (next) border
            if(moving_x > mid)
                border_index = i + 1;
        }

        return { position_index, border_index };
    }
    
    function mouseMoveHandler(e){
        if(profile.getIsClosingFile()) return;
        
        const { clientX: moving_x, clientY: moving_y } = e;
        const id_list = profile.files_id.map(id => `#${id}`).join(',');
        const files_position = profile.files_id.map(id => {
            const { 
                x, y, width, height, 
            } = document.getElementById(id).getBoundingClientRect();
            const mid = x + width / 2;
            
            return {
                x, y, mid, 
                width, height, 
            }
        });
        const {
            border_index, position_index
        } = getPositionIndex(moving_x, files_position);
        target_index = position_index;

        $("#draggable").css({
            display: `block`, 
            top: `${moving_y}px`, 
            left: `${moving_x}px`, 
        });
        //	reset all the border 
        $(id_list).css({
            borderLeft: ``, 
            borderRight: ``,  
        })
        
        //  only the most left side will show border-left
        if(border_index === 0)
            $(`#${profile.files_id[0]}`).css({
                borderLeft: `1px solid white`, 
            });
        else
            $(`#${profile.files_id[border_index - 1]}`).css({
                borderRight: `1px solid white`, 
            });
    }

    function mouseUpHandler(){
        const id_list = profile.files_id.map(id => `#${id}`).join(',');

        //	reset all the border 
        $(id_list).css({
            borderLeft: ``, 
            borderRight: ``,  
        })
        $("#draggable").css("display", "none");

        //	after switch position (change index of "profile.files_id")
        profile.switchPosition({
            source: selected_index, 
            target: target_index, 
        });
        //	rebuild file-path (sorting)
        const html_contents = profile.files_id.map(id => 
            document.getElementById(id).outerHTML
        );
        $(`#vs-file-path`).html(html_contents.join(""));

        //	re-bind the filenames clicked effect (switchPosition will rebuild the html element)
        $(id_list).unbind("click");
        $(id_list).unbind("mousedown");
        $(".fa-xmark").unbind("mousedown");
        $(".fa-xmark").unbind("mouseup");
        
        //	Similar close file
        $(".fa-xmark").bind("mousedown", handleCloseFile);
        //	Similar files selected, dragging, switch position effect
        $(id_list).bind("mousedown", function(){
            handleFileMoving({
                profile, files_id, 
                this_id: this.id, 
            }); 
        });

        document.removeEventListener("mousemove", mouseMoveHandler);
        document.removeEventListener("mouseup", mouseUpHandler);
    }

    if(profile.getIsClosingFile()) return;

    const filename = this_id.substring(this_id.indexOf('-') + 1);
    handleFileClick({ profile, filename });
    
    //	selected files index and moving target index position of "profile.files_id"
    const selected_index = profile.files_id.indexOf(this_id);
    let target_index = selected_index;
    const { left, top } = document.getElementById(this_id).getBoundingClientRect();

    $("#draggable").html($(`#${this_id}`).html());
    $("#draggable").css({
        top: `${top}px`, 
        left: `${left + 5}px`, 
    });
    
    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
}

function handleOpenFile(event){
    const generateFilePathElement = (filename, is_active = true) => {
        const id = `file-${filename}`;
        const active_class = (is_active)? " vs-file-active ": "";
        const file_path_element = `
            <span id="${id}" class="col-auto vs-file ${active_class}">
                <span class="ms-2 me-1 json-yellow">{ }</span>
                <span class="text-light">${filename}.json</span>
                <span class="ms-2 text-light">
                    <i class="fa-solid fa-xmark"></i>
                </span>
            </span>
        `;
        
        return file_path_element;
    }

    const file = event.target.files[0];
    //	remove the ".json" extension 
    let filename = file?.name || "";
    filename = (filename)? filename.substring(0, filename.indexOf('.')): "";

    if(file && filename && file.type === "application/json"){
        const reader = new FileReader();

        reader.onload = function(e){
            try{
                const json_str = e.target.result;
                const json = JSON.parse(json_str);
                const base64 = btoa(json_str);
                const data_url = `data:application/json;base64,${base64}`;
                const file_path_element = generateFilePathElement(filename);
                profile.line = 1;
                const json_content_element = profile.generateJSONElement({ 
                    json_obj: json 
                }).trim();
                
                profile.files[filename] = data_url;
                profile.files_id.push(`file-${filename}`);
                profile.json_content[filename] = json_content_element;
                
                //	Append new file content 
                $("#vs-file-path").append(file_path_element);
                $("#file-content").append(`
                    <div id="file-content-${filename}">${json_content_element}</div>
                `.trim());
                $(`#file-${filename}`).bind("mousedown", function(){
                    handleFileMoving({
                        profile, this_id: this.id, 
                    }); 
                });
                
                //	Default open a new file will hidden blank page 
                $(`#vs-page`).removeClass("d-none");
                $(`#closed-page`).removeClass("d-flex");
                $(`#closed-page`).addClass("d-none");

                profile.setActiveIndex(profile.files_id.length - 1);
                handleFileClick({ profile, filename: profile.getActiveSection() });
            }
            catch(error){
                console.error(error);
                console.log(`Fail to parsing JSON content.`);
            }
        };

        reader.readAsText(file);
    }
    else
        console.log(`Please upload a valid JSON file.`);
}

function handleCloseFile(){
    profile.setIsClosingFile(true);

    const id = this.parentElement.parentElement.id;
    const filename = id.substring(id.lastIndexOf('-') + 1);
    const index = profile.checkActiveIndex(filename);
    
    //	remove the close file element ("#file-xxx" and "#file-content-xxx")
    $(`#file-${filename}`).remove();
    $(`#file-content-${filename}`).remove();
    
    profile.closeFile(filename);

    //	already closed all files
    if(profile.files_id.length === 0){
        $(`#vs-page`).addClass("d-none");
        $(`#closed-page`).addClass("d-flex");
        $(`#closed-page`).removeClass("d-none");
    }
    else
        handleFileClick({ profile, filename: profile.getActiveSection() });

    profile.setIsClosingFile(false);
}
class Profile{
    constructor({
        host = window.location.origin, 
        files = {}, 
		typing_mode = false, 
        active_index = 0, 
    }){
        this.host = host;
        this.files = files;
		this.typing_mode = typing_mode;
        this.json_content = {};
        this.active_index = active_index;
		this.active_section = Object.keys(files)[active_index];
		//	for tracking closed file
		this.is_closing_file = false;
    }

	/*
		[Getter]
	*/
    getTypingMode = () => this.typing_mode;
	getJSONContent = () => this.json_content;
	getActiveIndex = () => this.active_index;
	getActiveSection = (index = this.active_index) => Object.keys(this.files)[index];
	getIsClosingFile = () => this.is_closing_file;
    
	/*
		[Setter]
	*/
    setTypingMode = (mode = false) => this.typing_mode = mode;
    setJSONContent = (json_content) => this.json_content = json_content;
    setActiveIndex = (index) => {
		this.active_index = index;
		this.active_section = this.getActiveSection(index);
	}
	setActiveSection = (section = this.getActiveSection(this.active_index)) => {
		this.active_section = section;
	}
	setIsClosingFile = (flag = false) => this.is_closing_file = flag;
	
	getMaxFilesIndex = () => Object.keys(this.files).length;
	checkActiveIndex = (section = this.active_section) => {
		return Object.keys(this.files).indexOf(section);
	}

    buildTypedElement = (json) => {
        const emails = [
            "@gmail.com", "@outlook.com", "@hotmail.com", 
            "@yahoo.com", "@icloud.com", "@mail.com", 
            "@aol.com", "@zoho.com", "@protonmail.com", 
            "@gmx.com", "@yandex.com", 
        ];
		const is_array = Array.isArray(json);
		let html_str = ``;
		let line = 1;
		
		if(is_array){
			//	start of array
			html_str += `
				<div>
					<span class="vs-line gray">${ line++ }</span>
					<span class="json-yellow">[</span>
				</div>
			`;

			for(let i=0; i<json.length; i++){
				//	property list - start looping
				html_str += `
					<div>
						<span class="vs-line gray">${ line++ }</span>
						<span class="tab json-purple">{</span>
					</div>
				`;
				
				 for(const [key, val] of Object.entries(json[i])){
					const type = typeof(val);
					const is_link = (type === "string")? val.startsWith("http"): false;
                    const is_email = emails.filter(email => val.toLowerCase().endsWith(email)).length;
                    let val_content = val;

                    if(is_link)
                        val_content = `<a href="${val}" target="_blank" class="json-string">${val}</a>`;
                    else if(is_email)
                        val_content = `<a href="mailto://${val}" target="_blank" class="json-string">${val}</a>`;

					html_str += `
						<div class="row m-0">
							<span class="col-auto vs-line gray">${ line++ }</span>
							<span class="col pe-0 tab-double" style="max-width: 1000px;">
								<span class="json-property">
									"${key}"
								</span>:
								<span class="json-${ typeof(val) }">
									"${val_content}"
								</span>, 
							</span>
						</div>
					`;
				}
				
				//	property list - end looping
				html_str += `
					<div>
						<span class="vs-line gray">${ line++ }</span>
						<span class="tab json-purple">}</span>
						${(i + 1 === json.length)? "": ","}
					</div>
				`;
			}
			
			//	end of array
			html_str += `
				<div>
					<span class="vs-line gray">${ line++ }</span>
					<span class="json-yellow">]</span>
				</div>
			`;
			html_str += `
				<span>
					<span class="vs-line">${ line++ }</span>
					<span class="typed-cursor typed-cursor--blink">|</span>
				</span>
			`;
		}
		else{
			//	start of array
			html_str += `
				<div>
					<span class="vs-line gray">${ line++ }</span>
					<span class="json-yellow">{</span>
				</div>
			`;
			
			for(const [key, val] of Object.entries(json)){
				let type = Array.isArray(val)? "array": typeof(val);
				let ele_val = ``;

				if(type === "array"){
					ele_val = `
						<span class="json-purple">[</span>
							${
								val.map(s => 
									`<span class="json-string">"${s}"</span>`
								).join(", ")
							}
						<span class="json-purple">]</span> , 
					`;
				}
				else{
					ele_val = `
						<span class="json-${ typeof(val) }">
							"${val}"
						</span>, 
					`;
				}
				
				html_str += `
					<div class="row m-0">
						<span class="col-auto vs-line gray">${ line++ }</span>
						<span class="col pe-0 tab" style="max-width: 1000px;">
							<span class="json-property">
								"${key}"
							</span>:
							${ ele_val }
						</span>
					</div>
				`;
			}

			//	start of array
			html_str += `
				<div>
					<span class="vs-line gray">${ line++ }</span>
					<span class="json-yellow">}</span>
				</div>
			`;
			html_str += `
				<span>
					<span class="vs-line">${ line++ }</span>
					<span class="typed-cursor typed-cursor--blink">|</span>
				</span>
			`;
		}

		return html_str;
	}

    buildJSONContent = async(files = this.files) => {
        let result = {};

        try{
            let promise_files = [];
            
            for(const section in files){
                const url = this.host + files[section];

                promise_files.push(
                    fetch(url).then(res => res.json())
                );
            }

            const json_contents = await Promise.all(promise_files);
            let idx = 0;
            
            for(const section in files){
                result[section] = this.buildTypedElement(json_contents[idx]);
                idx++;
            }
            
            //  re-assign 
            this.setJSONContent(result);
            return result;
        }catch(error){
            console.error(error);
			console.log(`[buildJSONContent] Fail to fetch files.`);
        }

        return result;
    }

    generateFilePathElement = (parent_id = "vs-file-path") => {
        const parent_element = document.querySelector(`#${parent_id}`);

        parent_element.innerHTML = "";
        for(const section in this.files){
            const id = `file-${section}`;
            const is_active = (section === this.active_section)? 
                ` vs-file-active `: ``;
            const file_path_element = `
                <span id="${id}" class="col-auto vs-file ${is_active}">
                    <span class="ms-2 me-1 json-yellow">{ }</span>
                    <span class="text-light">${section}.json</span>
                    <span class="ms-2 text-light">
                        <i class="fa-solid fa-xmark"></i>
                    </span>
                </span>
            `;
            
            parent_element.innerHTML += file_path_element;
        }
    }

    generateFileContentElement = (parent_id  = "file-content") => {
        const parent_element = document.querySelector(`#${parent_id}`);

        parent_element.innerHTML = "";
        for(const section in this.files){
            const id = `file-content-${section}`;
            //  true = hide this class, false = show
            const _class = (section === this.active_section)? 
                ``: `class="d-none"`;
            const file_content_element = `<div id="${id}" ${_class}></div>`;
            
            parent_element.innerHTML += file_content_element;
        }
    }

	//	active file
	activeSection = (active_section = this.getActiveSection(), typing_mode = this.getTypingMode()) => {
		if(active_section === undefined){
			this.setActiveIndex(0);
			active_section = this.getActiveSection(0);
		}

		//	show the new active files
		$(`#file-${active_section}`).addClass("vs-file-active");
		$(`#file-content-${active_section}`).html("");
		$(`#file-content-${active_section}`).removeClass("d-none");
		
		if(typing_mode){
			//	typing filename
			new Typed("#filename", {
				strings: [`${active_section}.json`], 
				typeSpeed: 1, backSpeed: 0, 
				cursorChar: "", 
				loop: false, 
			});

			//	typing file content
			new Typed(`#file-content-${active_section}`, {
				strings: [this.getJSONContent()[active_section]], 
				typeSpeed: 1, backSpeed: 0, 
				cursorChar: "", 
				loop: false, 
				onComplete: () => this.updateThumbnail({}), 
			});
		}
		else{
			$("#filename").html(`${active_section}.json`);
			$(`#file-content-${active_section}`).html(
				this.getJSONContent()[active_section]
			);
			this.updateThumbnail({});
		}
	}

	closeFile = (filename) => {
		const is_active_file = (filename === this.getActiveSection());
		
		//	delete filename and close the file and it content
		delete this.files[filename];
		$(`#file-${filename}`).css({
			"display": "none"
		});
		$(`#file-content-${filename}`).css({
			"display": "none"
		});

		this.setIsClosingFile(true);

		//	switch "active_section" to previous file, if the closed file = "active_section"
		if(is_active_file){
			//	Closed all the files
			if(this.getMaxFilesIndex() === 0)
				$(`#vs-path`).addClass("d-none");
			//	Switch to another files
			else{
				//	update active section to new index
				this.setActiveSection(this.getActiveSection());
			}
		}
	}

	updateThumbnail = async({
		preview_id = "file-content", 
		canvas_id = "canvas-content", 
		scale = 0.25, 
		//	width of line content element 
		offset_x = 60, 
	}) => {
		return new Promise((resolve, reject) => {
			const preview_element = document.getElementById(preview_id);
			const canvas_content = document.getElementById(canvas_id);
			const width = preview_element.clientWidth - offset_x;

			//	clear "canvas_content" and re-generate again apply to it
			canvas_content.innerHTML = "";
			html2canvas(preview_element, {
				scale, width,
				x: offset_x, 
			}).then(function(canvas){
				const w = canvas.width;
				const h = canvas.height;

				canvas.style.width = `${w}px`;
				canvas.style.height = `${h}px`;
				canvas_content.appendChild(canvas);

				// return true;
				resolve(true);
			}).catch(error => {
				console.error(error);
				console.log(`[updateThumbnail] Fail to convert element into canvas.`);

				reject(false);
			});
		});
	}

    //  true = initiate successful
    initiate = async() => {
        this.generateFileContentElement(); 
        this.generateFilePathElement(); 
        
        try{
            await this.buildJSONContent();
            
            return true;
        }catch(error){
            console.error(error);
            
            return false;
        }
    }
}

window.Profile = Profile;
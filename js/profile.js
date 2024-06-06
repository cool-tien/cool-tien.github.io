class Profile{
    constructor({
        files = {}, 
		active_index = 0, 
		typing_mode = false, 
        design_mode = false, 
    }){
        this.files = files;
		this.files_id = Object.keys(files).map(key => `file-${key}`);
		this.typing_mode = typing_mode;
		this.design_mode = design_mode;
        this.json_content = {};
        this.active_index = active_index;
		this.active_section = Object.keys(files)[active_index];
		//	for tracking closed file
		this.is_closing_file = false;
    }

	/*
		[Getter]
	*/
	getFiles = () => this.files;
	getFilesID = () => this.files_id;
    getTypingMode = () => this.typing_mode;
	getJSONContent = () => this.json_content;
	getActiveIndex = () => this.active_index;
	getActiveSection = (index = this.active_index) => {
		//	not more files exist
		if(this.files_id.length === 0) return "";

		const file_id = this.files_id[index];
		
		return file_id?.substring(file_id.indexOf('-') + 1) || 
			this.getActiveSection(this.files_id.length - 1);
	}
	getIsClosingFile = () => this.is_closing_file;
    
	/*
		[Setter]
	*/
	setFiles = (files = {}) => this.files = files;
	setFilesID = (files_id = []) => this.files_id = files_id;
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
	
	checkActiveIndex = (section = this.active_section) => {
		const file_id = `file-${section}`;

		return this.files_id.indexOf(file_id);
	}

	switchPosition = ({ source, target }) => {
		//	adjust the "target" to zero, when moved to the most left side
		target = (target === -1)? 0: target;
		//	if same position quit function, not need switch
		if(source === target) return; 
		
		[this.files_id[source], this.files_id[target]] = [this.files_id[target], this.files_id[source]];
		this.setActiveIndex(target);
	}

    buildTypedElement = (json) => {
        const emails = [
            "@gmail.com", "@outlook.com", "@hotmail.com", 
            "@yahoo.com", "@icloud.com", "@mail.com", 
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
                const url = files[section]; 
				
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
		const close_active_index = this.getActiveIndex();
		
		//	remove the filename data from "this.files" and "this.files_id"
		const file_id = `file-${filename}`;
		delete this.files[filename];
		this.files_id.splice(this.files_id.indexOf(file_id), 1);
		
		//	switch "active_section" to previous file, if the closed file = "active_section"
		if(is_active_file){
			//	Closed latest file
			if(this.files_id.length === close_active_index)
				this.setActiveSection(this.getActiveSection(close_active_index - 1));
			//	Switch to another files
			else
				//	update active section to new index
				this.setActiveSection(this.getActiveSection());
		}
	}

	updateThumbnail = async({
		preview_id = "file-content", 
		canvas_id = "canvas-content", 
		//	width of line content element 
		offset_x = 60, 
		//	default width of preview set to fixed size
		fixed_width = 180, 
	}) => {
		return new Promise((resolve, reject) => {
			const preview_element = document.getElementById(preview_id);
			const canvas_content = document.getElementById(canvas_id);
			const width = preview_element.clientWidth - offset_x;

			html2canvas(preview_element, {
				width, x: offset_x, 
			}).then(canvas => {
				const adjust_rate = fixed_width / canvas.width;
				const w = canvas.width * adjust_rate;
				const h = canvas.height * adjust_rate;

				canvas.style.width = `${w}px`;
				canvas.style.height = `${h}px`;
				//	clear "canvas_content" and re-generate again apply to it
				canvas_content.innerHTML = "";
				canvas_content.appendChild(canvas);

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

// export default Profile;
window.Profile = Profile;
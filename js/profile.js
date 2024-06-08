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
		//	for generate json element tracking the line number
		this.line = 1;
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

	generateJSONElement = ({ json_obj, depth = 0 }) => {
		const tab_space = (depth * 1.5) + 'rem';
		const adjust_style = (depth >= 2)? 
			// ` style="margin-left: -${depth * 1.5 + 3.75}rem !important" `: "";
			` style="margin-left: -6.75rem !important" `: "";

		//	default the json file outer label start from '{' or '['
		const htmlOpenTag = (label = '{') => {
			const type = (label === '{')? 
				'object': 'array';
			
			return (depth === 0 || label === '{')?
			// return (depth === 0)?
			`
				<div ${adjust_style} data-depth="${depth}">
					<span class="vs-line gray">${ this.line++ }</span>
					<span style="padding-left: ${tab_space}" class="json-${type}-${depth % 3}">
						${label}
					</span>
				</div>
			`.trim(): 
			`
				<span class="json-${type}-${depth % 3}">
				 ${label}
				</span>
			`;
		}
		//	default the json file outer label start from '{' or ']'
		const htmlCloseTag = (label = '}') => {
			const type = (label === '}')? 
				'object': 'array';

			if(depth === 0 || label === '}'){
			// if(depth === 0){
				return `
					<div ${adjust_style}>
						<span class="vs-line gray">${ this.line++ }</span>
						<span style="padding-left: ${tab_space}" class="json-${type}-${depth % 3}">
							${label}
						</span>${depth !== 0? ',': ''}
					</div>
				`.trim()
			}
			else{
				return `
					<span class="json-${type}-${depth % 3}">
						${label}
					</span>
				`.trim();
			}
		}

		const data_type = typeof json_obj;
		
		if(typeof json_obj === 'object' && json_obj !== null){
			//	Array 
			if(Array.isArray(json_obj)){
				//	estimate all the item of array will be same data type 
				const item_type = typeof json_obj[0] || 'string';
				const join_symbol = (item_type === 'object')? '': ',';
				const html_open_tag = htmlOpenTag('[');
				let html_content = json_obj.map(item => {
					return this.generateJSONElement({
						 json_obj: item, 
						 depth: depth + 1, 
					});
				}).join(join_symbol);
				
				//	will appear extra ',' replace it become blank
				if(item_type === 'object')
					html_content = html_content.replace(/,(?=[^,]*$)/, '');
				
				return html_open_tag + html_content + htmlCloseTag(']');
			}
				
			//	Object
			else{
				//	180px for canvas, 80px for width of row line 
				const max_width_style = `calc(100% - 180px - 80px)`;
				const property_space = (depth * 1.5 + 1.5) + 'rem';
				const html_open_tag = htmlOpenTag('{');
				const keys = Object.keys(json_obj);
				let html_content = keys.map((key, i) => {
					return `
						<div class="row m-0" ${adjust_style}>
							<span class="col-auto vs-line gray">${ this.line++ }</span>
							<span class="col pe-0" style="max-width: ${max_width_style}; padding-left: ${property_space}">
								<span class="json-property">
									"${key}"
								</span>:
								<span class="json-${ typeof(json_obj[key]) }">
									${
										this.generateJSONElement({ 
											json_obj: json_obj[key], 
											depth: depth + 1, 
										})
									}
								</span>
								${(i + 1) === keys.length? '': `,`}
							</span>
						</div>
					`;
				}).join("");
				
				return html_open_tag + html_content + htmlCloseTag('}');
			}
		}
		//	String
		else if(data_type === 'string'){
			const emails = [
				"@gmail.com", "@outlook.com", "@hotmail.com", 
				"@yahoo.com", "@icloud.com", "@mail.com", 
			];
			const is_link = (json_obj.startsWith("http"));
			const is_email = emails.filter(email => json_obj.toLowerCase().endsWith(email)).length;
			let content = json_obj;
			
			if(is_link)
				content = `<a class="json-string" href="${content}" target="_blank">${content}</a>`;
			else if(is_email)
				content = `<a class="json-string" href="mailto://${content}">${content}</a>`;
			
			return `
				<span class="json-string">
					"${content}"
				</span>
			`.trim();
		}
		//	Number | Boolean | Null
		else if(data_type === 'number' || data_type === 'boolean'){
			return `
				<span class="json-${data_type}">
					${json_obj}
				</span>
			`.trim();
		}
		else if(json_obj === null)
			return `
				<span class="json-null">
					null
				</span>
			`.trim();
		else
			return `
				<span class="json-string">
					"unknow"
				</span>
			`.trim();
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
            let index = 0;
            
            for(const section in files){
                this.line = 1;
				const json_obj = json_contents[index];
				const json_element = this.generateJSONElement({ json_obj }) + 
				//	blink effect on the last line
				`<span>
					<span class="vs-line">${ this.line }</span>
					<span class="typed-cursor typed-cursor--blink">|</span>
				</span>`;

				result[section] = json_element;
                index++;
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

window.Profile = Profile;
class Profile{
    constructor({
        typing_mode = false, 
        files = {}, 
        active_section = "", 
        active_index = 0, 
    }){
        this.typing_mode = typing_mode;
        this.files = files;
        this.json_content = {};
        this.active_section = active_section;
        this.active_index = active_index;
        
        if(active_section === "")
            this.active_section = Object.keys(files)[0];
    }

    getTypingMode = () => this.typing_mode;
    
    setTypingMode = (mode = false) => {
        this.typing_mode = mode;
    }

    getJSONContent = () => this.json_content;

    setJSONContent = (json_content) => {
        this.json_content = json_content;
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
						<div>
							<span class="vs-line gray">${ line++ }</span>
							<span class="tab-double">
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
					<div>
						<span class="vs-line gray">${ line++ }</span>
						<span class="tab">
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
        const host = window.location.origin;
        // const host = `https://cool-void-zero.github.io/`;
        let result = {};

        try{
            let promise_files = [];
            
            for(const section in files){
                const url = host + files[section];

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
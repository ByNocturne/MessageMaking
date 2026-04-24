let finalJson = [];
let editIndex = null;

// Função modular para capturar qualquer bloco de mensagem (Sucesso ou Falha)
function getMessageData(containerId) {
    const container = document.getElementById(containerId);
    const responseRows = container.querySelectorAll('.response-row');

console.log(`Encontradas ${responseRows.length} respostas em ${containerId}`);

    const responses = Array.from(responseRows).map(row => {
        return {
            button: row.querySelector('.resp-button').value,
            tag: row.querySelector('.resp-tag').value,
            end_message_flow: row.querySelector('.resp-end').checked
        };
    });
    
    return {
        title: container.querySelector('.msg-title').value,
        text: container.querySelector('.msg-text').value,
        input: container.querySelector('.msg-input-toggle').checked,
        input_field_identifier: "", 
        input_mask: container.querySelector('.msg-mask').value,
        min_length: 0, 
        max_length: 0,
        responses: responses,
        show_display_message: container.querySelector('.msg-show-display').checked
    };
}

// Função para capturar as regras
function getRules() {
    const ruleItems = document.querySelectorAll('.rule-item');
    return Array.from(ruleItems).map(item => ({
        type: item.querySelector('.rule-type').value,
        function_result: item.querySelector('.rule-result').value === "true"
    }));
}

function gerarJson() {
    // Validação simples para evitar erros de campos nulos
    const idMessage = document.getElementById('id_message').value;
    if (!idMessage) {
        alert("O ID da Mensagem é obrigatório!");
        return;
    }

    const newJson = {
        active: document.getElementById('active').checked,
        id_message: idMessage,
        selection_function: { rules: getRules() },
        message_branches: {
            on_success: {
                actions: [{ type: document.querySelector('#branch-success .action-type').value }],
                message: getMessageData('branch-success'),
                metadata_variables: null
            },
            on_failure: {
                actions: [{ type: document.querySelector('#branch-failure .action-type').value }],
                message: getMessageData('branch-failure'),
                metadata_variables: null
            }
        },
        triggered_by: [{
            root: document.querySelector('.trigger-root').value,
            id_message: document.querySelector('.trigger-id').value,
            message_tag: document.querySelector('.trigger-tag').value,
        }],
        priority: Number(document.getElementById('priority').value)
    };

    if (editIndex !== null) {
        finalJson[editIndex] = newJson;
        editIndex = null;
        document.getElementById('btn-generate-json').textContent = "Gerar JSON Final";
    } else {
        finalJson.push(newJson);
    }

    // Atualiza a visualização de texto (se o elemento existir)
    const preview = document.getElementById('json-preview');
    if (preview) {
        preview.textContent = JSON.stringify(finalJson, null, 2);
    }

    renderFluxograma();
}

window.addResponseField = function(containerId) {
    const list = document.getElementById(containerId);
    if (!list) return;

    const row = document.createElement('div');
    row.className = 'response-row';

    row.innerHTML = `
        <div>
            <label>Botão:</label>
            <input type="text" class="resp-button" placeholder="Ex: Sim">
        </div>
        <div>
            <label>Tag:</label>
            <input type="text" class="resp-tag" placeholder="Ex: tag_sim">
        </div>
        <div style="flex: 0; min-width: 80px; text-align: center;">
            <label>Encerrar?</label>
            <input type="checkbox" class="resp-end">
        </div>
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">X</button>
    `;

    list.appendChild(row);
}

document.addEventListener('DOMContentLoaded', () => {
    const btnLoad = document.getElementById('btn-load-json');
    const inputFiles = document.getElementById('import-json');

    // Abre a janela de seleção de ficheiro ao clicar no botão
    if (btnLoad) {
        btnLoad.addEventListener('click', () => inputFiles.click());
    }

    // Processa o ficheiro assim que for selecionado
    if (inputFiles) {
        inputFiles.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Garante que os dados importados vão para o nosso array global
                    finalJson = Array.isArray(importedData) ? importedData : [importedData];

                    // Atualiza o Preview de texto e o Fluxograma
                    document.getElementById('json-preview').textContent = JSON.stringify(finalJson, null, 2);
                    renderFluxograma();
                    
                    alert("JSON carregado com sucesso! ✅");
                } catch (err) {
                    alert("Erro ao ler o ficheiro JSON. Verifica o formato! ❌");
                }
            };
            reader.readAsText(file);
        });
    }
});

function renderFluxograma() {
    const canvas = document.getElementById('fluxogram');
    canvas.innerHTML = '<h3>Fluxograma de Mensagens</h3>';

    const roots = ["start", "pre-apply"];

    roots.forEach(rootName => {
        const rootSection = document.createElement('div');
        rootSection.className = 'root-section';
        rootSection.innerHTML = `<h4 class="root-title">Raiz: ${rootName}</h4>`;
        
        // 1. Mensagens iniciais da raiz
        let queue = finalJson.filter(msg => msg.triggered_by[0].root === rootName);
        let displayedIds = new Set();

        // 2. Processar a fila para permitir múltiplos níveis de encadeamento
        let i = 0;
        while (i < queue.length) {
            const currentItem = queue[i];
            
            // Evita duplicar o mesmo card na mesma raiz
            if (!displayedIds.has(currentItem.id_message)) {
                const isChild = currentItem.triggered_by[0].root === "any";
                renderCard(currentItem, rootSection, isChild);
                displayedIds.add(currentItem.id_message);

                // 3. Procura quem está "escutando" as tags desta mensagem atual
                const dependentes = finalJson.filter(msg => 
                    msg.triggered_by[0].root === "any" && 
                    msg.triggered_by[0].id_message === currentItem.id_message
                );

                // Adiciona os dependentes à fila para processamento posterior
                dependentes.forEach(dep => {
                    if (!displayedIds.has(dep.id_message)) {
                        queue.push(dep);
                    }
                });
            }
            i++;
        }

        if (rootSection.children.length > 1) {
            canvas.appendChild(rootSection);
        }
    });
}

// Função auxiliar para desenhar o card (evita repetição de código)
function renderCard(item, container, isChild = false) {
    const realIndex = finalJson.indexOf(item);
    
    // Cria um wrapper para a mensagem e os seus futuros filhos
    const wrapper = document.createElement('div');
    wrapper.className = "message-wrapper";
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";

    const card = document.createElement('div');
    card.className = 'flow-card';
    card.onclick = () => carregarParaEdicao(realIndex);

    const triggerData = item.triggered_by[0];
    const info = isChild 
        ? `🔌 Conectado: ${triggerData.id_message} [${triggerData.message_tag}]` 
        : '🔝 Raiz';

    card.innerHTML = `
        <div class="plug-info">${info}</div>
        <span class="flow-tag">ID: ${item.id_message}</span>
        <h5>${item.message_branches.on_success.message.title}</h5>
    `;

    wrapper.appendChild(card);
    
    // Cria o container onde as ramificações deste card específico vão morar
    const childrenContainer = document.createElement('div');
    childrenContainer.className = "children-container";
    childrenContainer.style.marginTop = "15px";
    childrenContainer.style.paddingLeft = "30px";
    wrapper.appendChild(childrenContainer);

    container.appendChild(wrapper);

    // Retornamos o container de filhos para que a função principal saiba onde pendurar os próximos
    return childrenContainer;
}

window.carregarParaEdicao = function(index) {
    editIndex = index; 
    const data = finalJson[index];

    document.getElementById('active').checked = data.active;
    document.getElementById('id_message').value = data.id_message;
    document.getElementById('priority').value = data.priority;
    document.querySelector('.trigger-root').value = data.triggered_by[0].root;
    document.querySelector('.trigger-id').value = data.triggered_by[0].id_message;
    document.querySelector('.trigger-tag').value = data.triggered_by[0].message_tag;

    // Usa a função correta para preencher os blocos
    preencherCamposMensagem('branch-success', data.message_branches.on_success);
    preencherCamposMensagem('branch-failure', data.message_branches.on_failure);

    document.getElementById('btn-generate-json').textContent = "Salvar Alterações";
    alert(`Editando: ${data.id_message}`);
};

function preencherCamposMensagem(containerId, branchData) {
    const container = document.getElementById(containerId);
    
    // Ação e Mensagem Base
    container.querySelector('.action-type').value = branchData.actions[0].type;
    container.querySelector('.msg-title').value = branchData.message.title;
    container.querySelector('.msg-text').value = branchData.message.text;
    container.querySelector('.msg-show-display').checked = branchData.message.show_display_message;
    container.querySelector('.msg-input-toggle').checked = branchData.message.input;
    container.querySelector('.msg-mask').value = branchData.message.input_mask;

    // Limpar e Reconstruir Respostas Dinâmicas
    const list = container.querySelector('.responses-list');
    list.innerHTML = ''; // Limpa as respostas atuais
    
    branchData.message.responses.forEach(resp => {
        // Usamos a função que você já tem para criar a linha
        window.addResponseField(list.id); 
        const lastRow = list.lastElementChild;
        lastRow.querySelector('.resp-button').value = resp.button;
        lastRow.querySelector('.resp-tag').value = resp.tag;
        lastRow.querySelector('.resp-end').checked = resp.end_message_flow;
    });
}

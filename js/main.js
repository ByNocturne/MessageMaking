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
    const btn = document.getElementById('btn-generate-json');
    if (btn) {
        btn.addEventListener('click', gerarJson); 
    }
})

function renderFluxograma() {
    const canvas = document.getElementById('fluxogram');
    canvas.innerHTML = '<h3>Fluxograma de Mensagens</h3>';

    const roots = ["start", "pre-apply"];

    roots.forEach(rootName => {
        const rootSection = document.createElement('div');
        rootSection.className = 'root-section';
        rootSection.innerHTML = `<h4 class="root-title">Raiz: ${rootName}</h4>`;
        
        // 1. Pega as mensagens que iniciam esta raiz específica
        let queue = finalJson.filter(msg => msg.triggered_by[0].root === rootName);
        
        // 2. Procura mensagens "any" que estejam ligadas a estas mensagens iniciais
        // Criamos um conjunto de IDs já exibidos para evitar loops infinitos
        let displayedIds = new Set();

        queue.forEach(item => {
            renderCard(item, rootSection);
            displayedIds.add(item.id_message);

            // Agora buscamos quem está plugado neste ID específico E nesta TAG específica
            // Precisamos percorrer as respostas da mensagem atual para saber quais tags existem
            const todasAsTagsDaMensagem = [
                ...item.message_branches.on_success.message.responses.map(r => r.tag),
                ...item.message_branches.on_failure.message.responses.map(r => r.tag)
            ];

            todasAsTagsDaMensagem.forEach(tag => {
                const dependents = finalJson.filter(msg => 
                    msg.triggered_by[0].root === "any" && 
                    msg.triggered_by[0].id_message === item.id_message && 
                    msg.triggered_by[0].message_tag === tag
                );

                dependents.forEach(dep => {
                    if (!displayedIds.has(dep.id_message)) {
                        renderCard(dep, rootSection, true);
                        displayedIds.add(dep.id_message);
                    }
                });
            });
        });

        if (rootSection.children.length > 1) {
            canvas.appendChild(rootSection);
        }
    });
}

// Função auxiliar para desenhar o card (evita repetição de código)
function renderCard(item, container, isChild = false) {
    const realIndex = finalJson.indexOf(item);
    const card = document.createElement('div');
    card.className = 'flow-card';
    if (isChild) card.style.marginLeft = "20px"; // Recuo visual para ramificações
    
    card.onclick = () => carregarParaEdicao(realIndex);
    
    card.innerHTML = `
        <div class="plug-info">${isChild ? `🔌 Plug: ${item.triggered_by[0].id_message} (${item.triggered_by[0].message_tag})` : '🔝 Raiz'}</div>
        <div class="plug-info">${isChild ? '🔌 Conectado a: ' + item.triggered_by[0].id_message : '🔝 Início da Raiz'}</div>
        <span class="flow-tag">ID: ${item.id_message}</span>
        <h5>${item.message_branches.on_success.message.title}</h5>
    `;
    container.appendChild(card);
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

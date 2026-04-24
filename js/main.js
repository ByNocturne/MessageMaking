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
    const newJson = {
        active: document.getElementById('active').checked,
        id_message: document.getElementById('id_message').value,
        selection_function: {
            rules: getRules()
        },
        message_branches: {
            on_success: {
                actions: [{ type: document.querySelector('#branch-success .action-type').value }],
                message: getMessageData('branch-success'),
                metadata_variables: null
            },
            on_failure: {
                actions: [{ type: document.querySelector('#branch-failure .action-type').value }], // Note que precisaremos do ID branch-failure no HTML
                message: getMessageData('branch-failure'),
                metadata_variables: null
            }
        },
        triggered_by: [
            {
                root: document.querySelector('.trigger-root').value,
                id_message: document.querySelector('.trigger-id').value,
                message_tag: ""
            }
        ],
        priority: Number(document.getElementById('priority').value)
    };

    if (editIndex !== null) {
        // Substitui o item antigo pelo novo no mesmo lugar
        finalJson[editIndex] = newJson;
        editIndex = null; // Reseta o estado
        document.getElementById('btn-generate-json').textContent = "Gerar JSON Final";
    } else {
        // Fluxo normal: adiciona um novo
        finalJson.push(newJson);
    }

    renderFluxograma(); // Em vez de apenas exibir texto, desenha os cards
    console.log("Fluxograma atualizado ✅");

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

// No main.js

function renderFluxograma() {
    const canvas = document.getElementById('fluxogram');
    canvas.innerHTML = '<h3>Fluxograma de Mensagens</h3>';

    finalJson.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'flow-card';

        const roots = ["start", "pre-apply"];

        roots.forEach(rootName => {
        // 1. Criamos um container para esta raiz
        const rootSection = document.createElement('div');
        rootSection.className = 'root-section';
        rootSection.innerHTML = `<h4 class="root-title">Raiz: ${rootName}</h4>`;
        
        // 2. Filtramos as mensagens que pertencem a esta raiz ou ramificação
        const relatedMessages = finalJson.filter(msg => 
            msg.triggered_by[0].root === rootName || 
            msg.triggered_by[0].root === "any" // Caso queira permitir mensagens genéricas
        );
        
        relatedMessages.forEach(item => {
            const card = document.createElement('div');
            card.className = 'flow-card';

            card.style.cursor = "pointer";
            card.onclick = () => carregarParaEdicao(index);
            
            // Verificamos se ela está "plugada" em alguém
            const isPlugged = item.triggered_by[0].message_tag !== "";
            const plugInfo = isPlugged ? 
                `<div class="plug-info">🔌 Plugado em: ${item.triggered_by[0].id_message} (${item.triggered_by[0].message_tag})</div>` : 
                `<div class="plug-info">🔝 Início da Raiz</div>`;

            card.innerHTML = `
                ${plugInfo}
                <span class="flow-tag">ID: ${item.id_message}</span>
                <h5>${item.message_branches.on_success.message.title}</h5>
                <div class="flow-buttons">
                    ${item.message_branches.on_success.message.responses.map(r => 
                        `<span class="tag-badge">${r.tag}</span>`
                    ).join('')}
                </div>
            `;
            rootSection.appendChild(card);
        });
        
        canvas.appendChild(card);
        
        // Adiciona uma "setinha" visual entre os cards, exceto no último
        if (index < finalJson.length - 1) {
            const arrow = document.createElement('div');
            arrow.innerHTML = '↓';
            arrow.style.fontSize = '24px';
            canvas.appendChild(arrow);
            }
        });
    })
}

window.carregarParaEdicao = function(index) {
    const data = finalJson[index];
    
    // 1. Configurações Básicas
    document.getElementById('active').checked = data.active;
    document.getElementById('id_message').value = data.id_message;
    document.getElementById('priority').value = data.priority;

    // 2. Gatilhos (Trigger)
    document.querySelector('.trigger-root').value = data.triggered_by[0].root;
    document.querySelector('.trigger-id').value = data.triggered_by[0].id_message;

    // 3. Carregar Blocos de Mensagem (Sucesso e Falha)
    preencherCamposMensagem('branch-success', data.message_branches.on_success);
    preencherCamposMensagem('branch-failure', data.message_branches.on_failure);

    // 4. Mudar o comportamento do botão "Gerar"
    // Dica: Podemos mudar o texto do botão para "Salvar Alterações"
    const btnGerar = document.getElementById('btn-generate-json');
    btnGerar.textContent = "Atualizar Mensagem";
    btnGerar.onclick = () => salvarEdicao(index);
    
    alert(`Editando mensagem: ${data.id_message}`);
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

window.carregarParaEdicao = function(index) {
    editIndex = index; 
    const data = finalJson[index];

    // Preenche campos básicos
    document.getElementById('id_message').value = data.id_message;
    document.getElementById('priority').value = data.priority;
    document.getElementById('active').checked = data.active;
    
    // Preenche os gatilhos
    document.querySelector('.trigger-root').value = data.triggered_by[0].root;
    document.querySelector('.trigger-id').value = data.triggered_by[0].id_message;

    // Para as mensagens de Sucesso e Falha, podes criar uma sub-função
    preencherDadosBranch('branch-success', data.message_branches.on_success);
    preencherDadosBranch('branch-failure', data.message_branches.on_failure);

    // Muda o texto do botão principal para avisar que é uma edição
    document.getElementById('btn-generate-json').textContent = "Salvar Alterações";
};


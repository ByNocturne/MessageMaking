let finalJson = [];

// Função modular para capturar qualquer bloco de mensagem (Sucesso ou Falha)
function getMessageData(containerId) {
    const container = document.getElementById(containerId);
    const responseRows = container.querySelectorAll('.response-row');
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

    finalJson.push({newJson});

    const previewElement = document.getElementById('json-preview');
    if (previewElement) {
        previewElement.textContent = JSON.stringify(finalJson, null, 2);
    }

}

addResponseField(container) {
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
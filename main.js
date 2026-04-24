// Função modular para capturar qualquer bloco de mensagem (Sucesso ou Falha)
function getMessageData(containerId) {
    const container = document.getElementById(containerId);
    
    return {
        title: container.querySelector('.msg-title').value,
        text: container.querySelector('.msg-text').value,
        input: container.querySelector('.msg-input-toggle').checked,
        input_field_identifier: "", // Podemos adicionar um campo no HTML depois se precisar
        input_mask: container.querySelector('.msg-mask').value,
        min_length: 0, // Como é padrão, podemos deixar fixo ou mapear
        max_length: 0,
        responses: [
            {
                button: "ok", // Aqui poderíamos mapear uma lista de botões
                tag: "ok",
                end_message_flow: true
            }
        ],
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
    const finalJson = {
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

    console.log("JSON Gerado:", JSON.stringify(finalJson, null, 2));
    alert("JSON gerado no console! (F12)");
}
export let structure = {
    "active": true,
    "id_message": "",
    "selection_function": {
        "rules": [
            {
            "type": "",
            "function_result": false
            }
        ]
    },
    "message_branches": {
        "on_success": {
            "actions": [
                {
                "type": ""
                }
            ],
            "message": {
                "title": "No action found.",
                "text": "No action found.",
                "input": false,
                "input_field_identifier": "",
                "input_mask": "",
                "min_length": 0,
                "max_length": 0,
                "responses": [
                    {
                        "button": "ok",
                        "tag": "ok",
                        "end_message_flow": true
                    }
                ],
                "show_display_message": false
            },
            "metadata_variables": null
        },
        "on_failure": {
            "actions": [
                {
                "type": ""
                }
            ],
            "message": {
                "title": "No action found.",
                "text": "No action found.",
                "input": false,
                "input_field_identifier": "",
                "input_mask": "",
                "min_length": 0,
                "max_length": 0,
                "responses": [
                    {
                        "button": "ok",
                        "tag": "ok",
                        "end_message_flow": true
                    }
                ],
                "show_display_message": false
            },
            "metadata_variables": null
        }
    },
    "triggered_by": [
        {
            "root": "any",
            "id_message": "",
            "message_tag": ""
        }
    ],
    "priority": 1
};

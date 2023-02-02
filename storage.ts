export type Variable_storage_types = number | string | boolean;

type Storage_value = `${"s" | "n" | "b"}${string}`;

function variable_to_string(value: Variable_storage_types): Storage_value {
    switch (typeof value) {
        case "string":
            return `s${value}` as const;
        case "number":
            return `n${value}` as const;
        case "boolean":
            return value ? "b1" : "b0";
    }
}

function string_to_variable(vv: Storage_value): Variable_storage_types {
    const prefix = vv[0];
    const value = vv.substring(1);
    switch (prefix) {
        case 's': //string
            return value;
        case 'n': //number
            return parseFloat(value);
        case 'b': //boolean
            return value === "1" ? true : false;
    }
    throw `invalid value: ${vv}`;
}

function is_storage_value(key: string): key is Storage_value {
    return key.length >= 1 && "snb".includes(key[0]);
}

export class Variable_storage {
    static get_variable(variable_name: string) {
        const stored = localStorage.getItem(`${variable_name}`);
        if (typeof stored !== "string") {
            console.error(`Tried to fetch undefined variable ${variable_name}`);
            return;
        }
        if (!is_storage_value(stored)) {
            return;
        }
        return string_to_variable(stored);
    }
    static set_variable(variable_name: string, value: Variable_storage_types) {
        localStorage.setItem(`${variable_name}`, variable_to_string(value));
    }
    static delete_variable(variable_name: string) {
        localStorage.removeItem(`${variable_name}`);
    }
    static clear_all() {
        localStorage.clear();
    }
    static get variables() {
        let result: { [key: string]: Variable_storage_types } = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (typeof key !== "string") {
                continue;
            }
            const value = localStorage.getItem(key);
            if (typeof value !== "string") {
                continue;
            }
            if (!is_storage_value(value)) {
                continue;
            }
            result[key] = string_to_variable(value);
        }
        return result;
    }
}
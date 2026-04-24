const fs = require('fs');
const path = require('path');

const parser = {
    parse: (tokens, palabraOriginal) => {
        // 1. Regla de Longitud (Análisis Sintáctico)
        if (tokens.length < 3) {
            return { error: "Error Sintáctico: La palabra es demasiado corta (mínimo 3 letras)." };
        }
        if (tokens.length > 12) {
            return { error: "Error Sintáctico: La palabra es demasiado larga (máximo 12 letras)." };
        }

        // 2. Regla de Unicidad (Validación contra el Diccionario)
        try {
            const data = fs.readFileSync(path.join(__dirname, 'words.json'), 'utf8');
            const diccionario = JSON.parse(data);

            if (diccionario.includes(palabraOriginal.toUpperCase())) {
                return { error: "Error Sintáctico: La palabra ya existe en el juego." };
            }

            return { success: true, diccionarioActual: diccionario };
        } catch (err) {
            return { error: "Error de Sistema: No se pudo leer el diccionario." };
        }
    }
};

module.exports = parser;
const lexer = {
    tokenize: (input) => {
        const tokens = [];
        // Convertimos a mayúsculas para estandarizar
        const cleanInput = input.trim().toUpperCase();

        for (let i = 0; i < cleanInput.length; i++) {
            const char = cleanInput[i];

            // Expresión regular: Solo letras de la A a la Z y Ñ
            if (/[A-ZÁÉÍÓÚÑ]/.test(char)) {
                tokens.push({ type: 'LETRA', value: char });
            } else {
                // Si encuentra un número, espacio o símbolo, lanza error léxico
                return { 
                    error: `Error Léxico: El caracter '${char}' no está permitido.` 
                };
            }
        }
        return tokens;
    }
};

// Esta línea es la que conecta con server.js
module.exports = lexer;
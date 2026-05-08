const lexer = {
    tokenize: (input) => {
        const tokens = [];
        // Normalizacion de palabras
        // si la palabra lleva tilde la guarda sin ella. es decir:
        // CAMIÓN se guardará internamente como CAMION
        // si alguien guarda CAMIÓN y luego alguien mas guarda CAMION el backend lo impedirá
        // esto para evitar duplicados
        const cleanInput = input.trim()
            .normalize("NFD")               // Paso 1: Separa la letra del acento
            .replace(/[\u0300-\u036f]/g, "") // Paso 2: Borra el acento
            .toUpperCase();                  // Paso 3: Todo a mayúsculas

        for (let i = 0; i < cleanInput.length; i++) {
            const char = cleanInput[i];

            // Validamos solo letras estándar y la Ñ
            if (/[A-ZÑ]/.test(char)) {
                tokens.push({ type: 'LETRA', value: char });
            } else {
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
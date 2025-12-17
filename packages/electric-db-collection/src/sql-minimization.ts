export function dedupeParams(params: Array<unknown>, where?: string) {
    const dedupedParams = new Map<unknown, number>()
    const placeholderMapping = new Map<number, number>()

    params.forEach((param, idx) => {
        if (!dedupedParams.has(param)) dedupedParams.set(param, dedupedParams.size)
        placeholderMapping.set(idx, dedupedParams.get(param)!)
    })

    return {
        // replace old param placeholders with new unique ones
        where: where?.replace(/\$(\d+)/g, (_, group) => {
            const originalIndex = parseInt(group, 10) - 1
            const uniqueIndex = placeholderMapping.get(originalIndex)!
            return `$${uniqueIndex + 1}`
        }),
        // return only unique params
        params: Array.from(dedupedParams.entries())
    }
}

export function dedupeWhere(expr?: string) {
    if (!expr) return expr;

    // Parse the expression into segments at the root level
    const segments: Array<string> = [];

    // Track operators found at the root level
    const operators = new Set<string>();

    let depth = 0;
    let start = 0;

    for (let i = 0; i < expr.length; i++) {
        const c = expr[i];
        if (c === '(') {
            depth++;
            if (depth === 1) {
                const operator = expr.slice(start, i).trim();
                if (operator) operators.add(operator);
                start = i
            };
        }
        else if (c === ')') {
            depth--;
            if (depth === 0) {
                const segment = expr.slice(start, i + 1);
                segments.push(segment);
                start = i + 1;
            }
        }
    }

    // If no parentheses were found, treat the whole expression as a single segment
    if (!start) {
        segments.push(expr.trim());
    }

    // TODO: This should not be possible by design
    if (operators.size > 1) {
        throw new Error(`Mixed operators at root level: ${Array.from(operators).join(', ')}`);
    }

    // Get the single operator (if any)
    const [operator] = Array.from(operators)

    // Deduplicated segments
    const deduped = new Set(segments);

    return Array.from(deduped).join(` ${operator} `);
}
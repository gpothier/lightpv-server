addToMap = function(map, key, q) {
	if (map[key] === undefined) map[key] = q;
	else map[key] += q;
}


export const convertToKG = (weight: number, unit: string) =>{
    switch ((unit || "kg").toLowerCase()) {
        case "kg":
            return weight;
        case "g":
            return weight / 1000;
        case "lb":
            return weight / 2.20462;
        case "oz":
            return weight / 35.274;
        default:
            return weight;
    }
}
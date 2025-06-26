import { saveAs } from "file-saver";

export const saveFile = (e, url: string, name: string) => {
    e.stopPropagation();
    saveAs(url,name);
};

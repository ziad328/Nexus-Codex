import useData from "./useData";
import type { Tag } from "../types";

const useTags = () => useData<Tag>("/tags", { params: { page_size: 20 } });

export default useTags;

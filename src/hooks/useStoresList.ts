import useData from "./useData";
import type { Store } from "../types";

const useStores = () => useData<Store>("/stores");

export default useStores;

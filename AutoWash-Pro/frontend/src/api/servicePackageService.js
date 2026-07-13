import servicePackageApi from "./servicePackageApi";

export const getAllServices = async () => servicePackageApi.list();
export const getActiveServices = async () => servicePackageApi.active();
export const getServiceById = async (id) => servicePackageApi.get(id);
export const createService = async (data) => servicePackageApi.create(data);
export const updateService = async (id, data) => servicePackageApi.update(id, data);
export const deactivateService = async (id) => servicePackageApi.delete(id);

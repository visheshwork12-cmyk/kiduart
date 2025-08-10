import AdminModel from '@models/superadmin/admin.model.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';

const createAdmin = async (adminBody) => {
  return AdminModel.create(adminBody);
};

const findAdminByEmail = async (email) => {
  return AdminModel.findOne({ email }).select('+password');
};

const findAdminById = async (id) => {
  return AdminModel.findById(id);
};

const findAdmins = async (filter, options) => {
  return AdminModel.paginate(filter, options);
};

const updateAdmin = async (id, updateBody) => {
  const admin = await AdminModel.findById(id);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
  }
  Object.assign(admin, updateBody);
  await admin.save();
  return admin;
};

const deleteAdmin = async (id) => {
  const admin = await AdminModel.findById(id);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
  }
  await admin.deleteOne();
};

export default {
  createAdmin,
  findAdminByEmail,
  findAdminById,
  findAdmins,
  updateAdmin,
  deleteAdmin,
};

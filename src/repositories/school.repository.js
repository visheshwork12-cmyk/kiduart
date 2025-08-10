const { SchoolModel } = require('@models/superadmin/school.model');
const ApiError = require('@shared/utils/apiError');
const httpStatus = require('http-status');
const redis = require('@lib/redis');

class SchoolRepository {
  async create(schoolData) {
    try {
      const school = await SchoolModel.create(schoolData);
      return school;
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to create school');
    }
  }

  async findById(schoolId) {
    try {
      const cacheKey = `school:${schoolId}`;
      const cachedSchool = await redis.get(cacheKey);
      if (cachedSchool) {
        return JSON.parse(cachedSchool);
      }
      const school = await SchoolModel.findById(schoolId);
      if (!school) {
        throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
      }
      await redis.set(cacheKey, JSON.stringify(school), 'EX', 300);
      return school;
    } catch (error) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async findAll({ page = 1, limit = 10, sortBy = 'createdAt' }) {
    try {
      const cacheKey = `schools:page:${page}:limit:${limit}:sort:${sortBy}`;
      const cachedSchools = await redis.get(cacheKey);
      if (cachedSchools) {
        return JSON.parse(cachedSchools);
      }
      const schools = await SchoolModel.paginate({}, { page, limit, sortBy });
      await redis.set(cacheKey, JSON.stringify(schools), 'EX', 300);
      return schools;
    } catch (error) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async update(schoolId, updateData) {
    try {
      const school = await SchoolModel.findByIdAndUpdate(schoolId, updateData, { new: true });
      if (!school) {
        throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
      }
      const cacheKey = `school:${schoolId}`;
      await redis.del(cacheKey);
      return school;
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
  }

  async delete(schoolId) {
    try {
      const school = await SchoolModel.findByIdAndDelete(schoolId);
      if (!school) {
        throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
      }
      const cacheKey = `school:${schoolId}`;
      await redis.del(cacheKey);
      return { message: 'School deleted successfully' };
    } catch (error) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
    }
  }
}

module.exports = new SchoolRepository();
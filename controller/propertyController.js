const twilio = require('twilio')(process.env.SID, process.env.AUTH_TOKEN)
require('dotenv').config()
const Property = require('../model/propertySchema')
const Image = require('../model/imageSchema')
const mime = require('mime-types');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});


const getPropertyList = async (req, res, next) => {
  try {
    const search_query = req.query.search_query; //This line extracts the value of the search_query query parameter from the request objec
    let properties = await Property.find({ available: true });
    if (search_query) {
      properties = await Property.find({
        $or: [
          { title: { $regex: search_query, $options: 'i' } },
          { description: { $regex: search_query, $options: 'i' } },
          { city: { $regex: search_query, $options: 'i' } },
          { state: { $regex: search_query, $options: 'i' } },
          { country: { $regex: search_query, $options: 'i' } }
        ],
        available: true
      });
    }
    res.status(200).json(properties);
  } catch (error) {
    next(error);
  }
};

//@ description  get property 
//@ access private
const getAllProperty = async (req, res) => {
  try {
    const property = await Property.find().populate({
      path: 'owner',
      select: 'name , email',
    })
    res.json({ count: property.length, property }).status(200)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const uploadImage = async (imagePath) => {

  // Use the uploaded file's name as the asset's public ID and 
  // allow overwriting the asset with new versions
  const options = {
    use_filename: true,
    unique_filename: false,
    overwrite: true,
  };

  try {
    // Upload the image
    const result = await cloudinary.uploader.upload(imagePath, options);
    console.log(result);
    return result.public_id;
  } catch (error) {
    console.error(error);
  }
};

//@ description  create property
//@ access private
const createProperty = async (req, res) => {
  try {
    const { owner, title, description, price, address, city, state, country, zipcode, available, image } = req.body

    const imagePublicId = await uploadImage(image);

    const newProperty = new Property({
      owner,
      title,
      description,
      price,
      address,
      city,
      state,
      country,
      zipcode,
      available,
      image: imagePublicId,
    });

    const fileExtensions = ['png', 'jpeg', 'gif', 'svg+xml']; // Replace with the actual file extensions of the image
    const contentType = fileExtensions
      .map(extension => mime.lookup(extension))
      .find(contentType => contentType !== false)
    const newImage = new Image({
      user: newProperty.owner,
      image: {
        data: image, // Assuming you have the binary image data available
        contentType: contentType, // Replace with the appropriate MIME type of the image
      }
    });
    const savedImage = await newImage.save();

    twilio.messages.create({
      from: '+16206589313',
      to: '+233201487955',
      body: `Hello ${newProperty.title}, Thank you adding your property with Hunt's .make much and help more !!`
    })
      .then((res) => console.log("Message has  been sent"))

    const savedProperty = await newProperty.save()
    console.log("savedProperty", savedProperty)
    res.status(201).json({ "savedProperty": savedProperty, "savedImage": savedImage })

  } catch (error) {
    console.log(error);
  }
}

//@ description  update property
///@ access private
const updateProperty = async (req, res) => {

  try {
    const property = await Property.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { $set: { ...req.body, updated_at: Date.now() } },
      {
        new: true,
        runValidators: true,
      }
    );
    await property.save()

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.status(200).json(property);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
  twilio.messages.create({
    from: '+16206589313',
    to: '+233201487955',
    body: `Hello, you have just updated your property with Hunt's .make much and help more !!`
  })
    .then((res) => console.log("Message has  been sent"))
}

//@ description  deleteproperty
//@ access private
const deleteProperty = async (req, res) => {
  try {
    await Property.findByIdAndDelete(
      { _id: req.params.id, owner: req.user._id },
    );
    res.status(201).json({ message: 'property deleted' })
  } catch (error) {
    res.status(403).send('Hello, you are forbidden to entry')
  }

}



module.exports = {
  getPropertyList,
  getAllProperty,
  createProperty,
  updateProperty,
  deleteProperty,
}

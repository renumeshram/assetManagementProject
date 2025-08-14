import Express from 'express';
import Express from 'express';

const validateLogin = (req, res, next) =>{
    const {sapId, password} =req.body;
    if(!sapId || !password){
        return res.status(400).json({msg: 'SAP ID and password are required'});
    }
    next();
}

const validateRegister = (req, res, next) =>{
    const {name, sapId, email, password, section, department } =req.body;
    if(!name || !sapId || !email || !password || !section || !department){
        return res.status(400).json({msg: 'All fields are required'});
    }
    next();

}

const validateRaiseRequest = (req, res, next) =>{
    const { asset, category, quantity, requestDate, department, section} = req.body;
    if(!asset || !category || !quantity || !requestDate || !department || !section){
        return res.status(400).json({msg: 'All fields are required'});
    }
    next();
}

const validateDirectRequest = (req, res, next) =>{
    const { sapId, userName, assetName, categoryName, quantity } = req.body;
    if (!sapId || !userName || !assetName || !categoryName || !quantity) {
        return res.status(400).json({ msg: 'All fields are required for direct request' });
    }
    next();
}

const validateUpdateInventory = (req, res, next) => {
    const {assetName, categoryName, stocks} = req.body;
    if (!assetName || !categoryName || !stocks) {
        return res.status(400).json({ msg: 'Asset name, category name, and stocks are required' });
    }
    next();
}

const validateReturnAsset = (req, res, next) =>{
    const { asset, category, section, department, transactionType, quantity, returnDate, sapId, isEwaste } = req.body;
    if (!asset || !category || !section || !department || !transactionType || !quantity || !returnDate || !sapId || !isEwaste) {
        return res.status(400).json({ msg: 'All fields are required for returning asset' });
    }
    next();
}

export {
    validateLogin,
    validateRegister,
    validateRaiseRequest,
    validateDirectRequest,
    validateUpdateInventory,
    validateReturnAsset
}
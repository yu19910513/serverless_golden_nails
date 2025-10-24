import { createServerlessHandler } from '../../utils/createServerlessApp.js';
import { getServices } from './routes/index.js';

export default createServerlessHandler('/api/services', (router) => {
    router.get('/', getServices);         
});